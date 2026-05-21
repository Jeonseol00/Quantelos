import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://eboktgkqamjmnkrfqxvy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVib2t0Z2txYW1qbW5rcmZxeHZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkzMzc3NzksImV4cCI6MjA5NDkxMzc3OX0.UAuzbqv1KexU2vrRb6duOuyU8kJOwyUFcvKUCUNObNM';

// In-Memory Storage Adapter murni JavaScript (menghindari dependensi native AsyncStorage)
const memoryStorage: Record<string, string> = {};
const InMemoryStorage = {
  getItem: (key: string) => Promise.resolve(memoryStorage[key] ?? null),
  setItem: (key: string, value: string) => { memoryStorage[key] = value; return Promise.resolve(); },
  removeItem: (key: string) => { delete memoryStorage[key]; return Promise.resolve(); },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: InMemoryStorage,
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false,
  },
});
