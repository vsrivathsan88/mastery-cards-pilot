import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@simili/shared': path.resolve(__dirname, '../../packages/shared/src'),
      '@simili/agents': path.resolve(__dirname, '../../packages/agents/src'),
      '@simili/lessons': path.resolve(__dirname, '../../packages/lessons/src'),
    },
  },
  server: {
    port: 5174, // Different port from tutor-app (5173)
  },
})
