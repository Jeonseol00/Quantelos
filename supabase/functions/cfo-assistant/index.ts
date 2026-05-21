import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { GoogleGenerativeAI } from 'npm:@google/generative-ai';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { query, financialContext } = await req.json();
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    
    if (!apiKey) {
      throw new Error('Missing Gemini API Key');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-3.0-flash' });

     const systemPrompt = `Anda adalah Quantelos, AI CFO pintar untuk bisnis parfum mewah pemilik.
    Tugas Anda adalah:
    1. Menganalisis pencatatan kas masuk/keluar, mendeteksi tren pengeluaran abnormal.
    2. Memberikan masukan strategis terkait Gross Profit Margin.
    
    Data Keuangan Saat Ini (Konteks RAG): 
    ${JSON.stringify(financialContext)}
    `;

    const chat = model.startChat({
      history: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      generationConfig: { temperature: 0.2 },
    });

    const result = await chat.sendMessageStream(query);
    
    // Server-Sent Events (SSE) Streaming Response
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ text: chunkText })}\n\n`));
        }
        controller.close();
      }
    });

    return new Response(stream, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
