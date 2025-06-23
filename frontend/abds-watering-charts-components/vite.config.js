import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.includes('-chart.ce')
        }
      }
    })
  ],
  build: {
    lib: {
      entry: './src/main.js',
      name: 'abds-chart-components',
      fileName: 'abds-chart-components'
    }
  },
  define: {
    'process.env': process.env
  }
})