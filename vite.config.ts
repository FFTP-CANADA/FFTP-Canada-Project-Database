// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // This line makes assets load correctly on GitHub Pages:
  base: '/FFTP-Canada-Project-Database/',
})
