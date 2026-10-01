import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  resolve: { preserveSymlinks: true },
  esbuild: { tsconfigRaw: { compilerOptions: { jsx: 'react-jsx' } } },
  optimizeDeps: { esbuildOptions: { preserveSymlinks: true, tsconfigRaw: {} } },
  build: { target: 'es2020', cssMinify: true, reportCompressedSize: false, rollupOptions: { output: { manualChunks: id => /node_modules[\/](react|react-dom|scheduler)[\/]/.test(id) ? 'react' : undefined } } },
  server: { port: 5173, strictPort: true, proxy: { '/api': { target: 'http://127.0.0.1:8787', changeOrigin: false } } }
});
