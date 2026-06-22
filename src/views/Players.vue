<template>
  <div class="players-wrapper">
    <div class="card list-card">
      <PlayerList
        title="Squad"
        :players="players"
        :listed-ids="listedIds"
        show-salary
        show-value
        action-width="24px"
      >
        <template #actions="{ player }">
          <PlayerRowMenu :player="player"/>
        </template>
      </PlayerList>
    </div>
  </div>
</template>

<script>
import PlayerList from '../components/PlayerList.vue';
import PlayerRowMenu from '../components/PlayerRowMenu.vue';

export default {
  name: 'Players',

  components: {
    PlayerList,
    PlayerRowMenu,
  },

  computed: {
    players() { return this.$store.state.team.players },
    listedIds() { return this.$store.getters.listedPlayerIds },
  },
}
</script>

<style lang="scss" scoped>

// Full-width, card-based; the list grows with the viewport.
.players-wrapper {
  padding: 12px;
}

// Sized to the columns (position, name, skill, age, salary, value, menu).
.list-card {
  max-width: 640px;
  margin: 0 auto;
  overflow: visible;
}

</style>
