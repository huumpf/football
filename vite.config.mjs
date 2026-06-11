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
        additionalData: `@import "@/assets/scss/var-color-base.scss";
@import "@/assets/scss/var-color-mapping.scss";
@import "@/assets/scss/var-breakpoints.scss";
@import "@/assets/scss/var-fonts.scss";
@import "@/assets/scss/var-z.scss";`
      }
    }
  },
  server: {
    port: Number(process.env.PORT) || 8080
  }
})
