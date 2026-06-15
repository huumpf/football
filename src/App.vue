<template>
  <div class="app-wrapper">
    <Navigation v-if="$route.meta.showNav" @advance-week="startWeekTransition"/>
    <div class="app-content">
      <router-view/>
    </div>
    <WeekTransition
      v-if="weekTransition.active"
      :from="weekTransition.from"
      :to="weekTransition.to"
      :mode="weekTransition.mode"
      @midpoint="commitWeek"
      @finished="endWeekTransition"
    />
  </div>
</template>

<script>
import Navigation from './components/Navigation.vue'
import WeekTransition from './components/WeekTransition.vue'
import * as CFG from '@/assets/js/Config.js'

export default {
  name: 'App',

  components: {
    Navigation,
    WeekTransition,
  },

  data() {
    return {
      weekTransition: { active: false, mode: 'week', from: null, to: null },
    }
  },

  methods: {
    // Capture the target up front and play the overlay; the real store update
    // happens later, at the midpoint. At week 52 advanceWeek rolls the season,
    // so the overlay counts the season up instead of the week.
    startWeekTransition() {
      if (this.weekTransition.active) return;
      const { week, season } = this.$store.state.club;
      this.weekTransition = week >= CFG.SEASON_WEEKS
        ? { active: true, mode: 'season', from: season, to: season + 1 }
        : { active: true, mode: 'week', from: week, to: week + 1 };
    },

    commitWeek() {
      this.$store.dispatch('advanceWeek');
    },

    endWeekTransition() {
      this.weekTransition.active = false;
    },
  },
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
  font-family: $font_body;
  font-size: 20px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: $col_text;
}

// Headlines keep the condensed display face; everything else is body copy.
h1, h2, h3, .headline {
  font-family: $font_heading;
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

// Shared surface for the card-based, responsive grid layout. Every card
// (except the navbar, which doesn't use this class) shares the same padding.
.card {
  background-color: $col_module_background;
  border-radius: 12px;
  padding: $card_padding;
}

// Title at the top of every list, above the column-label titleRow.
.list-headline {
  padding: $list_headline_padding;
  font-family: $font_heading;
  font-size: 20px;
  font-weight: 500;
  text-align: left;
  color: $col_text;
}
</style>