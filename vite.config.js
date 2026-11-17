import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

export default defineConfig({
  plugins: [react()],
  build: {
    chunkSizeWarningLimit: 650,
    rollupOptions: {
      input: { main: resolve(import.meta.dirname, 'index.html'), portfolio: resolve(import.meta.dirname, 'portfolio/index.html') },
      output: { manualChunks: { three: ['three'], react: ['react', 'react-dom'] } },
    },
  },
});
