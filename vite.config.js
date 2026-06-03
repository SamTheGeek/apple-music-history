import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: env.VITE_PUBLIC_URL || '/',
    publicDir: 'public',
    plugins: [react()],
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode),
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return undefined;
            }
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('\\react\\')) {
              return 'react-vendor';
            }
            if (id.includes('scheduler')) {
              return 'react-vendor';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'chart-vendor';
            }
            if (id.includes('@sentry')) {
              return 'sentry-vendor';
            }
            if (id.includes('papaparse') || id.includes('fflate') || id.includes('match-sorter')) {
              return 'data-vendor';
            }
            if (id.includes('html2canvas')) {
              return 'canvas-vendor';
            }
            if (id.includes('bootstrap')) {
              return 'ui-vendor';
            }
            return 'vendor';
          },
        },
      },
    },
    worker: {
      format: 'es',
    },
    test: {
      environment: 'node',
      include: ['src/**/*.test.{js,jsx}', 'src/**/__tests__/**/*.test.js'],
      setupFiles: ['./vitest.setup.js'],
    },
  };
});
