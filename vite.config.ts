import { resolve } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// `base: './'` keeps every generated URL relative to the page that loads it,
// so the same build works at the root during development and under
// https://<user>.github.io/<repo>/ once it is published.
export default defineConfig({
  base: "./",
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, "index.html"),
        slides: resolve(__dirname, "slides/index.html"),
      },
    },
  },
});
