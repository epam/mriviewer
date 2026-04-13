import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import glslPlugin from 'vite-plugin-glsl';

export default defineConfig({
  plugins: [react(), glslPlugin()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'lcov'],
    },
  },
});
