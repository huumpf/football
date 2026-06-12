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
@use "@/assets/scss/var-fonts.scss" as *;
@use "@/assets/scss/var-z.scss" as *;`
      }
    }
  },
  server: {
    port: Number(process.env.PORT) || 8080
  }
})
