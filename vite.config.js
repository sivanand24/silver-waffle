import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const REACT_PACKAGES = ["react", "react-dom", "scheduler"];

/** React rarely changes, so it gets its own long-cached chunk. */
function manualChunks(id) {
  const path = id.replaceAll("\\", "/");
  return REACT_PACKAGES.some((name) => path.includes(`/node_modules/${name}/`))
    ? "react"
    : undefined;
}

export default defineConfig({
  plugins: [react()],
  resolve: { preserveSymlinks: true },
  esbuild: { tsconfigRaw: { compilerOptions: { jsx: "react-jsx" } } },
  optimizeDeps: { esbuildOptions: { preserveSymlinks: true, tsconfigRaw: {} } },
  build: {
    target: "es2020",
    cssMinify: true,
    reportCompressedSize: false,
    rollupOptions: { output: { manualChunks } },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.ui.test.jsx"],
    setupFiles: ["./src/test/setup.js"],
    css: false,
    restoreMocks: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: { "/api": { target: "http://127.0.0.1:8787", changeOrigin: false } },
  },
});
