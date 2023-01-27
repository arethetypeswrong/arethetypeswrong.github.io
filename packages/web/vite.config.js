import { defineConfig } from "vite";

export default defineConfig(() => ({
  root: './src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  worker: {
    format: 'es'
  },
  define: {
    // https://github.com/antimatter15/untar.js/pull/5
    ByteStream: 'globalThis.ByteStream',
  }
}));
