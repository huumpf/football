<template>
  <div class="team-list-wrapper">
    <TeamListHeader v-if="team.length > 0"/>
    <div class="player-list">
      <TeamListItem
      v-for="(player, index) in team" 
      :key="index"
      :firstName="player.firstName"
      :lastName="player.lastName"
      :positions="player.positions"
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


.team-list-wrapper {
  height: 100%;
  overflow: scroll;
  background-color: $col_page_background_secondary;
  border-left: 1px solid $col_module_border;
}
  @media screen and (max-width:1200px) {
  .draft-list-wrapper {
    background-color: $col_page_background_secondary;
  }}

.player-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  overflow: scroll;
}

</style>