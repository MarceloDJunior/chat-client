import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import svgr from 'vite-plugin-svgr';

// https://vitejs.dev/config/
export default defineConfig({
  // Config to enable aliases also for SCSS files
  resolve: {
    alias: {
      '@': 'src',
    },
  },
  plugins: [react(), tsconfigPaths(), svgr()],
});
