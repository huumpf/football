<template>
  <div class="team-list-wrapper card">
    <PlayerList v-if="team.length > 0" :players="team"/>
  </div>
</template>

<script>
import PlayerList from '../components/PlayerList.vue';

export default {
  name: 'TeamList',

  components: {
    PlayerList,
  },

  computed: {
    team() { return this.$store.state.team.players },
  }
}
</script>

<style lang="scss" scoped>


// Scroll the list inside the card so the sidebar stays put on wide screens.
.team-list-wrapper {
  min-height: 0;
  overflow: auto;
}

</style>