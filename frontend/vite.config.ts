import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    // All /api calls go to the Spring Boot backend during development
    proxy: {
      '/api': 'http://localhost:8080',
    },
  },
})
