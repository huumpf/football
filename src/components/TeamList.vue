<template>
  <div class="team-list-wrapper">
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


.team-list-wrapper {
  height: 100%;
  padding: 12px;
  overflow: scroll;
  background-color: $col_page_background;
  border-left: 1px solid $col_module_border;
}
  @media screen and (max-width:1200px) {
  .draft-list-wrapper {
    background-color: $col_page_background_secondary;
  }}

</style>