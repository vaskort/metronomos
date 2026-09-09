import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import aliases from './vite.aliases';

export default defineConfig({
  plugins: [react()],
  resolve: { alias: aliases },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
