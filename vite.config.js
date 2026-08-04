const { defineConfig } = require('vite')
const vue = require('@vitejs/plugin-vue')

module.exports = defineConfig({
  plugins: [vue()],
  base: './',
  build: {
    outDir: 'app',
    emptyOutDir: false
  },
  server: {
    host: '0.0.0.0',
    port: 5173
  }
})
