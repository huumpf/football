<template>
  <div class="player">
    <p>{{ position }}</p>
    <p v-if="player">{{ player.lastName }}</p>
    <p v-if="player">50</p>
    <p v-if="!player">No player available</p>
  </div>
</template>

<script>
export default {
  name: 'LineupItem',

  props: {
    position: String,
    player: Object,
  },

}
</script>

<style lang="scss" scoped>

.player {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  margin: 10px 0;
  padding: 20px 30px;
  border-radius: 8px;
  font-size: 20px;
  background-color: $col_module_background;
}
@media screen and (max-width: $breakpoint_tablet) {
  .player {
    padding: 10px 20px;
  }
}

</style>