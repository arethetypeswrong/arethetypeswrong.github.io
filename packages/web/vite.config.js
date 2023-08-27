import { defineConfig } from "vite";
import { execSync } from "child_process";
import { resolve } from "path";

export default defineConfig(() => ({
  root: "./src",
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        test: resolve(__dirname, "src/test.html"),
      },
    },
    outDir: "../dist",
    emptyOutDir: true,
  },
  worker: {
    format: "es",
  },
  define: {
    COMMIT: JSON.stringify(execSync("git rev-parse HEAD").toString().trim().substring(0, 7)),
  },
  optimizeDeps: {},
}));
