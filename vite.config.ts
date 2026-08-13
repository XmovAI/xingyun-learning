import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig(({ command }) => ({
  // Built assets are hosted under /learning/ on OSS, so production URLs need
  // the prefix. Keep dev on root path so the port-3000 dev server is unaffected.
  // Override with VITE_BASE=/foo/ to deploy under a different prefix.
  base: command === 'build' ? process.env.VITE_BASE || '/learning/' : '/',
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
}));
