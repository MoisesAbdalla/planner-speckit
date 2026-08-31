import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    projects: [
      {
        plugins: [react()],
        test: {
          name: 'unit',
          environment: 'jsdom',
          globals: true,
          setupFiles: ['./tests/setup.ts'],
          include: ['tests/unit/**/*.test.{ts,tsx}', 'tests/components/**/*.test.{ts,tsx}'],
        },
      },
      {
        test: {
          name: 'rules',
          environment: 'node',
          globals: true,
          include: ['tests/rules/**/*.test.ts'],
          testTimeout: 20000,
          hookTimeout: 30000,

        },
      },
      {
        test: {
          name: 'integration',
          environment: 'node',
          globals: true,
          include: ['tests/integration/**/*.test.ts'],
          testTimeout: 30000,
          hookTimeout: 30000,
          // Aponta o app para os emuladores: o teste exercita o codigo real.
          env: {
            VITE_FIREBASE_API_KEY: 'demo-key',
            VITE_FIREBASE_AUTH_DOMAIN: 'planner-rules-test.firebaseapp.com',
            VITE_FIREBASE_PROJECT_ID: 'planner-rules-test',
            VITE_FIREBASE_STORAGE_BUCKET: 'planner-rules-test.appspot.com',
            VITE_FIREBASE_MESSAGING_SENDER_ID: '000000000000',
            VITE_FIREBASE_APP_ID: '1:000000000000:web:demo',
            VITE_USE_FIREBASE_EMULATORS: 'true',
          },
        },
      },
    ],
  },
});
