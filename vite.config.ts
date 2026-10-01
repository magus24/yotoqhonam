import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// NOTE: `base` is set to './' so that the production build works from ANY
// sub-path on GitHub Pages (https://user.github.io/yotoqhonam/).
// Routing uses HashRouter, so deep links survive hard refreshes without
// needing a server-side SPA fallback.
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three', '@react-three/fiber', '@react-three/drei'],
          motion: ['framer-motion'],
          react: ['react', 'react-dom', 'react-router-dom'],
        },
      },
    },
  },
});
