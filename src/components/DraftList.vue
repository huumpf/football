<template>
  <div class="draft-list-wrapper">
    <h1>Your squad</h1>
    <div class="player-list">
      <PlayerListItem
      v-for="(player, index) in team" 
      :key="index"
      :firstName="player.firstName"
      :lastName="player.lastName"
      :skill="player.skill"
      :age="player.age"
      />
    </div>
  </div>
</template>

<script>
import PlayerListItem from '../components/PlayerListItem.vue';

export default {
  name: 'DraftList',

  components: {
    PlayerListItem,
  },

  computed: {
    team() { return this.$store.state.team.players },
  }
}
</script>

<style lang="scss" scoped>

.draft-list-wrapper {
  height: 100vh;
  padding: 20px;
  overflow: scroll;
}

.player-list {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.player-list:last-child {
  margin-bottom: 30px;
}

</style>