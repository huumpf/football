<template>
  <div class="player">
    <p class="position">{{ position }}</p>
    <p v-if="player" class="name">{{ player.lastName }}</p>
    <p v-if="player" class="skill">{{ player.skill }}</p>
    <p v-if="!player" class="noPlayer">No player available</p>
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

.name {
  flex-grow: 3;
}

.position, .skill {
  flex-grow: 1;
}

.noPlayer {
  flex-grow: 4;
  color: $col_text_secondary;
}

</style>