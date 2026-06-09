import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Base path for GitHub Pages: https://achrafthedev.github.io/react-calculator-app/
  base: '/react-calculator-app/',
  server: {
    port: 3000,
    open: true
  }
});
