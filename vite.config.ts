import { resolve } from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// Two entries: the POC app, and the slide deck that documents it. The deck
// imports the app's token files directly rather than copying values.
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'index.html'),
        presentation: resolve(__dirname, 'presentation/index.html'),
      },
    },
  },
})
