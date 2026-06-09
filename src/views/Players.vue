<template>
  <div class="players-wrapper">
    <PlayerList :players="players" show-salary/>
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

.players-wrapper {
  padding: 30px;
  max-width: 900px;
  margin: 0 auto;
}

</style>
