module.exports = {
  css: {
    loaderOptions: {
      sass: {
        additionalData: `@import "@/assets/scss/var-color-base.scss";
@import "@/assets/scss/var-color-mapping.scss";
@import "@/assets/scss/var-breakpoints.scss";`
      }
    }
  }
};