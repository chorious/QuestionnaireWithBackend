import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/QuestionnaireWithBackend/',
  plugins: [react()],
  define: {
    __APP_VERSION__: JSON.stringify(new Date().toISOString()),
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3000',
    },
  },
});
