import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@use "@/assets/scss/var-color-base.scss" as *;
@use "@/assets/scss/var-color-mapping.scss" as *;
@use "@/assets/scss/var-breakpoints.scss" as *;
@use "@/assets/scss/var-spacing.scss" as *;
@use "@/assets/scss/var-fonts.scss" as *;
@use "@/assets/scss/var-z.scss" as *;`
      }
    }
  },
  server: {
    port: Number(process.env.PORT) || 8080,
    // In development the SPA runs on Vite and the PHP API on `php -S`; this
    // forwards /api to it so the browser sees one same-origin server (and the
    // session cookie just works). In production both are served from the
    // webspace, so this proxy is dev-only.
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true
      }
    }
  }
})
