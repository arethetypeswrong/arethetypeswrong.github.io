import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  root: './src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  worker: {
    format: 'es'
  },
  define: mode === 'development' ? {
    ByteStream: 'undefined', // https://github.com/antimatter15/untar.js/pull/5
  } : undefined,
}));
