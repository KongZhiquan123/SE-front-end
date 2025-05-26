import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath } from 'url'
import path from 'path'
import monacoEditorPluginModule from 'vite-plugin-monaco-editor'
import Inspect from 'vite-plugin-inspect'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const isObjectWithDefaultFunction = (module: unknown): module is { default: typeof monacoEditorPluginModule } => (
    module != null &&
    typeof module === 'object' &&
    'default' in module &&
    typeof module.default === 'function'
)
const monacoEditorPlugin = isObjectWithDefaultFunction(monacoEditorPluginModule)
    ? monacoEditorPluginModule.default
    : monacoEditorPluginModule
// https://vite.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    Inspect(),
    monacoEditorPlugin({})
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, '/api')
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  }
})