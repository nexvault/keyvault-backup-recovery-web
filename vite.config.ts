import ssl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import { viteSingleFile } from 'vite-plugin-singlefile';
import wasm from 'vite-plugin-wasm';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), nodePolyfills(), wasm(), ssl(), viteSingleFile()],
  build: {
    minify: 'terser',
    terserOptions: {
      format: {
        comments: false, // 删除所有注释
      },
    },
  },
  resolve: {
    alias: {
      'argon2-browser': path.resolve(__dirname, 'node_modules/argon2-browser/dist/argon2-bundled.min.js'),
    },
  },
});
