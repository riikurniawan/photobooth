import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import solidPlugin from 'vite-plugin-solid';
import devtools from 'solid-devtools/vite';

export default defineConfig({
  base: 'https://riikurniawan.github.io/photobooth/',
  plugins: [devtools(), solidPlugin(), tailwindcss()],
  server: {
    port: 3000,
  },
  build: {
    target: 'esnext',
  },
});
