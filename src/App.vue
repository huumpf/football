<template>
  <!-- <div id="nav">
    <router-link to="/">Home</router-link> |
    <router-link to="/about">About</router-link>
  </div> -->
  <Navigation/>
  <div class="app-content">
    <router-view/>
  </div>
</template>

<script>
import Navigation from './components/Navigation.vue'

export default {
  name: 'App',

  components: {
    Navigation,
  }
}
</script>

<style lang="scss">
* {
  margin: 0;
  padding: 0;
}

html {
  background-color: $col_page_background;
}

.app-content {
  margin-left: 80px;
}

</style>