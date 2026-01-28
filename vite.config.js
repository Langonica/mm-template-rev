import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/meridian-master/',
  plugins: [react()],
  build: {
    // Disables minification for both JavaScript and CSS
    minify: false,
    // Optional: ensures code is not compressed or mangled if using Terser
    terserOptions: {
      compress: false,
      mangle: false,
    },
  },
})
