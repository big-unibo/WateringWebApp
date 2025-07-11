import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue()
  ],
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/main.js'),
      name: 'abds-watering-chart-components',
      fileName: (format) => `abds-watering-chart-components.${format}.js`
    }
  },
  rollupOptions: {
    external: ['vue'], // Exclude vue from the bundle
    output: {
      globals: {
        vue: 'Vue'
      }
    }
  },
  define: {
    'process.env': process.env
  }
})