import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',   // escucha en todas las interfaces (LAN, Hamachi, etc.)
    port: 5173,
    strictPort: false,  // si 5173 está ocupado sube al siguiente libre
    proxy: {
      '/api':       'http://localhost:3001',
      '/socket.io': { target: 'http://localhost:3001', ws: true },
    },
  },
});
