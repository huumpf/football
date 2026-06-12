<template>
  <div
    class="player"
    :class="{ 'skill-only': skillOnly, editable, open }"
    @click="toggle"
  >
    <template v-if="skillOnly">
      <p class="position">{{ position }}</p>
      <p v-if="countMode" class="skill">{{ count }}</p>
      <p v-else-if="player" class="skill">{{ skillValue }}</p>
      <p v-else class="noPlayer">–</p>
    </template>
    <template v-else>
      <div class="info">
        <p class="position">{{ position }}</p>
        <p class="name"><template v-if="player"><span class="first-initial">{{ player.firstName.charAt(0) }}.&nbsp;</span>{{ player.lastName }}</template></p>
      </div>
      <p class="skill">{{ player ? skillValue : '' }}</p>
    </template>

    <!-- Editable lineup: pick any squad player who can fill this position. -->
    <DropdownMenu
      v-if="open"
      :options="candidates"
      empty-text="No player available"
      @select="pick($event.player)"
      @close="close"
    />
  </div>
</template>

<script>
import { effectiveSkill } from '../assets/js/Helpers.js';
import DropdownMenu from '@/components/DropdownMenu.vue';

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
    // Editable mode (team view): clicking opens a dropdown to set the player.
    editable: Boolean,
    // Full squad, used to build the candidate list for this position.
    squad: {
      type: Array,
      default: () => [],
    },
    // This slot's index within its position (e.g. the 2nd of two CB slots).
    slotIndex: {
      type: Number,
      default: 0,
    },
  },

  data: () => {
    return {
      open: false,
    }
  },

  computed: {
    // The skill the slotted player brings to THIS position.
    skillValue() {
      return this.player ? effectiveSkill(this.player, this.position) : null;
    },

    // Every other squad player who can play this position, best first. Players
    // already used elsewhere are included; their skill reflects this position.
    candidates() {
      if (!this.editable) return [];
      return this.squad
        .filter(p => p !== this.player && effectiveSkill(p, this.position) > 0)
        .map(p => ({
          player: p,
          label: this.shortName(p),
          value: effectiveSkill(p, this.position),
        }))
        .sort((a, b) => b.value - a.value);
    },
  },

  methods: {
    shortName(player) {
      return `${player.firstName.charAt(0)}. ${player.lastName}`;
    },

    toggle() {
      if (!this.editable) return;
      this.open = !this.open;
    },

    close() {
      this.open = false;
    },

    pick(player) {
      this.$emit('pick', { position: this.position, slotIndex: this.slotIndex, player });
      this.close();
    },
  },

  components: {
    DropdownMenu,
  },
}
</script>

<style lang="scss" scoped>

// Team-overview box: a compact vertical card (position · name · skill) so six
// columns fit side by side and up to five boxes still stack in one column.
.player {
  position: relative;
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
  font-weight: 500;
  color: $col_text_secondary;
}

.name {
  font-size: 15px;
  font-weight: 500;
  word-break: break-word;
}

.skill {
  font-size: 13px;
}

.noPlayer {
  font-size: 12px;
  color: $col_text_secondary;
}

// Team-overview box (Figma): a fixed-width pill with the player name on the
// left and their skill value in a fixed column on the right. Empty slots keep
// the same width so the field stays evenly gridded.
.player:not(.skill-only) {
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 160px;
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
    font-size: 12px;
    font-weight: 500;
    color: $col_text;
    opacity: 0.5;
  }

  .name {
    flex: 1 1 auto;
    min-width: 0;
    font-size: 12px;
    font-weight: 500;
    color: $col_text;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    text-align: left;
  }

  .skill {
    flex-shrink: 0;
    width: 25px;
    text-align: center;
    font-size: 12px;
    font-weight: 500;
    color: $col_text;
  }
}

// On a narrow formation card there is no room for the abbreviated first
// name, so only the last name remains.
@container formation-card (max-width: 980px) {
  .player:not(.skill-only) .name .first-initial {
    display: none;
  }
}

// Clickable when the lineup is editable.
.player.editable {
  cursor: pointer;
  transition: background-color 0.12s ease;
}

.player.editable:hover {
  background-color: #2e4129;
}

.player.open {
  z-index: 10;
}

// Compact box for the draft squad preview: position (grey) next to the skill value.
.player.skill-only {
  flex-direction: row;
  justify-content: center;
  gap: 3px;
  margin: 3px auto;
  padding: 3px 6px;
  width: auto;
  font-size: 12px;
  font-weight: 500;
}

.player.skill-only .position {
  flex-grow: 0;
  font-size: 12px;
  color: $col_text_secondary;
}

.player.skill-only .skill,
.player.skill-only .noPlayer {
  flex-grow: 0;
  font-size: 12px;
}

</style>
