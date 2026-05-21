// metro.config.js — Quantelos CFO
// Konfigurasi Metro Bundler untuk kompatibilitas Hermes Engine
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Blokir modul Node.js-only yang tidak kompatibel dengan Hermes
// Ini mencegah error "Invalid expression encountered" pada dynamic import()
config.resolver.resolveRequest = (context, moduleName, platform) => {
  // Daftar modul Node.js yang TIDAK boleh masuk ke bundle React Native
  const blockedModules = [
    'ws',
    'bufferutil',
    'utf-8-validate',
    '@supabase/node-fetch',
    'node-fetch',
  ];

  if (blockedModules.includes(moduleName)) {
    return {
      type: 'empty',
    };
  }

  // Gunakan resolver default untuk modul lainnya
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
