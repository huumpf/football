module.exports = {
  css: {
    loaderOptions: {
      scss: {
        additionalData: `
        @import "@/assets/scss/var-color-base.scss";
        @import "@/assets/scss/var-color-mapping.scss";
        `,
      },
    },
  },
};