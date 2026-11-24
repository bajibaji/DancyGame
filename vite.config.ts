import { readFileSync } from 'node:fs'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')) as { version: string }

export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    watch: { ignored: ['**/node_modules/**', '**/.*.tmpdir/**', '**/.*.tmp'] },
  },
  define: { __APP_VERSION__: JSON.stringify(pkg.version) },
})
