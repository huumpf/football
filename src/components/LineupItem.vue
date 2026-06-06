<template>
  <div class="player" :class="{ 'skill-only': skillOnly }">
    <template v-if="skillOnly">
      <p class="position">{{ position }}</p>
      <p v-if="countMode" class="skill">{{ count }}</p>
      <p v-else-if="player" class="skill">{{ player.skill }}</p>
      <p v-else class="noPlayer">–</p>
    </template>
    <template v-else>
      <p class="position">{{ position }}</p>
      <p v-if="player" class="name">{{ player.lastName }}</p>
      <p v-if="player" class="skill">{{ player.skill }}</p>
      <p v-if="!player" class="noPlayer">No player available</p>
    </template>
  </div>
</template>

<script>
export default {
  name: 'LineupItem',

  props: {
    position: String,
    player: Object,
    // When true, render a compact box showing only the slotted player's skill
    // (used by the draft squad preview), instead of position + name + skill.
    skillOnly: Boolean,
    // Count mode (Overview): show a plain count value instead of a player's skill.
    countMode: Boolean,
    count: [Number, String],
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

// Compact box for the draft squad preview: position (grey) next to the skill value.
.player.skill-only {
  justify-content: center;
  gap: 6px;
  margin: 3px auto;
  padding: 5px 10px;
  width: auto;
  font-size: 17px;
  font-weight: 600;
}

.player.skill-only .position {
  flex-grow: 0;
  color: $col_text_secondary;
}

.player.skill-only .skill,
.player.skill-only .noPlayer {
  flex-grow: 0;
}

</style>