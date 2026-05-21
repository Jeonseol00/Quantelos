export const generateGeminiResponse = async (apiKey: string, prompt: string): Promise<string> => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('API Key tidak valid atau kosong.');
  }

  const cleanKey = apiKey.trim();
  
  // Model list from newest/fastest to oldest/most universally available (May 2026 alignment)
  const modelsToTry = [
    'gemini-3.5-flash',
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-1.5-flash',
    'gemini-pro'
  ];

  let lastError = null;

  for (const model of modelsToTry) {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 4096,
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        
        // If 404, it means the model is not available for this key/region. Try next model.
        if (response.status === 404 || errorData?.error?.status === 'NOT_FOUND') {
          lastError = new Error(`Model ${model} tidak didukung. Mencoba model alternatif...`);
          continue; 
        }

        console.error(`[Gemini API Error - ${model}]`, errorData);
        throw new Error(`Gagal menghubungi server Gemini (Status: ${response.status}). Pesan: ${errorData?.error?.message || 'Unknown'}`);
      }

      const data = await response.json();
      
      if (data.candidates && data.candidates.length > 0) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Format respons tidak dikenali dari Google Gemini.');
      }
    } catch (error: any) {
      // If it's a 404 error from inside the try block, continue to next model
      if (error.message.includes('Mencoba model alternatif')) {
        continue;
      }
      // Otherwise, it's a real network/API error, stop trying
      console.error(`[Gemini Pipeline Error - ${model}]`, error);
      throw new Error(error.message || 'Terjadi kesalahan jaringan atau server.');
    }
  }

  // If all models failed
  throw new Error(`Semua model AI gagal diakses. Pastikan API Key valid dan billing aktif. Error terakhir: ${lastError?.message}`);
};
