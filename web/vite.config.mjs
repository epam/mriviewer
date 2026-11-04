import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Existing Three.js FileLoader calls expect shader asset URLs.
  assetsInclude: ['**/*.vert', '**/*.frag'],
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
