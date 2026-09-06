import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Puerto distinto al de wing-house-web (5173) para poder correr ambos
// proyectos al mismo tiempo en desarrollo sin que choquen.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5174,
    host: true
  }
})
