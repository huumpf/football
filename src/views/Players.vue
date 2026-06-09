<template>
  <div class="players-wrapper">
    <div class="card list-card">
      <PlayerList :players="players" show-salary/>
    </div>
  </div>
</template>

<script>
import PlayerList from '../components/PlayerList.vue';

export default {
  name: 'Players',

  components: {
    PlayerList,
  },

  computed: {
    players() { return this.$store.state.team.players },
  },
}
</script>

<style lang="scss" scoped>

// Full-width, card-based; the list grows with the viewport.
.players-wrapper {
  padding: 12px;
}

.list-card {
  overflow: hidden;
}

</style>
