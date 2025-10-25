import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        host: '0.0.0.0',
        strictPort: true,
        hmr: {
          clientPort: 443, // For Replit's proxy
        },
        proxy: {
          // Proxy API requests to backend
          '/api': {
            target: 'http://localhost:4000',
            changeOrigin: true,
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
          // Polyfill Node.js modules for browser (LangChain compatibility)
          'node:async_hooks': 'empty-module',
          'async_hooks': 'empty-module',
          'fs': 'empty-module',
          'os': 'empty-module',
          'zlib': 'empty-module',
          'https': 'empty-module',
        }
      },
      optimizeDeps: {
        include: ['eventemitter3'],
        exclude: ['@langchain/langgraph', '@langchain/core', '@langchain/google-genai'],
        esbuildOptions: {
          target: 'esnext',
        },
        force: true,
      },
      build: {
        commonjsOptions: {
          transformMixedEsModules: true,
        },
        target: 'esnext',
      },
    };
});
