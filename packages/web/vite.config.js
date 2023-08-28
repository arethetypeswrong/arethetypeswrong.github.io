import { defineConfig } from "vite";
import { execSync } from 'child_process';

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
    COMMIT: JSON.stringify(execSync('git rev-parse HEAD').toString().trim().substring(0, 7)),
  },
  optimizeDeps: {
  },
}));
