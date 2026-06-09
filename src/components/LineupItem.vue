<template>
  <div class="player" :class="{ 'skill-only': skillOnly }">
    <template v-if="skillOnly">
      <p class="position">{{ position }}</p>
      <p v-if="countMode" class="skill">{{ count }}</p>
      <p v-else-if="player" class="skill">{{ player.skill }}</p>
      <p v-else class="noPlayer">–</p>
    </template>
    <template v-else>
      <div class="info">
        <p class="position">{{ position }}</p>
        <p v-if="player" class="name">{{ playerName }}</p>
        <p v-else class="noPlayer">No player available</p>
      </div>
      <p v-if="player" class="skill">{{ player.skill }}</p>
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

  computed: {
    // Design shows the name as first-initial + last name, e.g. "P. Robinson".
    playerName() {
      if (!this.player) return '';
      return `${this.player.firstName.charAt(0)}. ${this.player.lastName}`;
    },
  },

}
</script>

<style lang="scss" scoped>

// Team-overview box: a compact vertical card (position · name · skill) so six
// columns fit side by side and up to five boxes still stack in one column.
.player {
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  gap: 1px;
  margin: 4px 0;
  padding: 7px 8px;
  border-radius: 8px;
  background-color: $col_module_background;
}

.position {
  font-size: 12px;
  font-weight: 600;
  color: $col_text_secondary;
}

.name {
  font-size: 15px;
  font-weight: 600;
  word-break: break-word;
}

.skill {
  font-size: 13px;
}

.noPlayer {
  font-size: 12px;
  color: $col_text_secondary;
}

// Team-overview box (Figma): a white pill with the player name on the left and
// their skill value in a fixed column on the right.
.player:not(.skill-only) {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  max-width: 160px;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: $col_module_background;

  .info {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .position {
    flex-shrink: 0;
    width: 25px;
    font-size: 16px;
    font-weight: 500;
    color: $col_text;
    opacity: 0.5;
  }

  .name {
    font-size: 16px;
    font-weight: 600;
    color: $col_text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .skill {
    flex-shrink: 0;
    width: 25px;
    text-align: center;
    font-size: 16px;
    font-weight: 600;
    color: $col_text;
  }

  .noPlayer {
    font-size: 13px;
    color: $col_text_secondary;
  }
}

// Compact box for the draft squad preview: position (grey) next to the skill value.
.player.skill-only {
  flex-direction: row;
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
  font-size: 17px;
  color: $col_text_secondary;
}

.player.skill-only .skill,
.player.skill-only .noPlayer {
  flex-grow: 0;
  font-size: 17px;
}

</style>