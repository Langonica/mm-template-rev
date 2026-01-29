import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  // Change this base path to match your deployment directory
  // Examples: '/' for root domain, '/my-app/' for subdirectory
  base: '/meridian-master/',
  plugins: [react()],
})
