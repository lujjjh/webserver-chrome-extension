import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  build: {
    assetsDir: "",
    rollupOptions: {
      input: {
        background: resolve(__dirname, "src", "background.ts"),
      },
      output: {
        entryFileNames: "[name].js",
        format: "iife",
      },
    },
    sourcemap: true,
  },
});
