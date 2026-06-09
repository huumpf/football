<template>
  <div class="app-wrapper">
    <Navigation v-if="$route.meta.showNav"/>
    <div class="app-content">
      <router-view/>
    </div>
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
@import url('https://fonts.googleapis.com/css2?family=Saira+Extra+Condensed:wght@100;200;300;400;500;600;700;800;900&display=swap');
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700&display=swap');

* {
  margin: 0;
  padding: 0;
  -webkit-box-sizing: border-box;
  -moz-box-sizing:    border-box;
  -ms-box-sizing:     border-box;
  -o-box-sizing:      border-box;
  box-sizing:         border-box;
}

html {
  background-color: $col_page_background;
}

#app {
  font-family: 'Saira Extra Condensed', Avenir, Helvetica, Arial, sans-serif;
  font-size: 20px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: $col_text;
}

.app-wrapper {
  height: 100vh;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
}

.app-content {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}
</style>