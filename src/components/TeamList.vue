<template>
  <div class="draft-list-wrapper">
    <div class="player-list">
      <TeamListHeader v-if="team.length > 0"/>
      <TeamListItem
      v-for="(player, index) in team" 
      :key="index"
      :firstName="player.firstName"
      :lastName="player.lastName"
      :position="player.position"
      :skill="player.skill"
      :age="player.age"
      />
    </div>
  </div>
</template>

<script>
import TeamListItem from '../components/TeamListItem.vue';
import TeamListHeader from '../components/TeamListHeader.vue';

export default {
  name: 'TeamList',

  components: {
    TeamListItem,
    TeamListHeader,
  },

  computed: {
    team() { return this.$store.state.team.players },
  }
}
</script>

<style lang="scss" scoped>

.draft-list-wrapper {
  height: 100%;
  overflow: scroll;
  background-color: $col_page_background_secondary;
}

.player-list {
  display: flex;
  flex-direction: column;
  align-items: center;
}

</style>