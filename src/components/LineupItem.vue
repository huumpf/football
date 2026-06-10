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
        <p class="name">{{ player ? playerName : '' }}</p>
      </div>
      <p class="skill">{{ player ? skillValue : '' }}</p>
    </template>

    <!-- Editable lineup: pick any squad player who can fill this position. -->
    <div v-if="open" class="dropdown" @click.stop>
      <button
        v-for="(c, ci) in candidates"
        :key="ci"
        type="button"
        class="option"
        :class="{ secondary: c.secondary }"
        @click="pick(c.player)"
      >
        <span class="opt-name">{{ shortName(c.player) }}</span>
        <span class="opt-skill">{{ c.skill }}</span>
      </button>
      <p v-if="!candidates.length" class="empty">Kein Spieler verfügbar</p>
    </div>
  </div>
</template>

<script>
import { effectiveSkill } from '../assets/js/Helpers.js';

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
    // Editable mode (Aufstellung): clicking opens a dropdown to set the player.
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
    // Design shows the name as first-initial + last name, e.g. "P. Robinson".
    playerName() {
      if (!this.player) return '';
      return this.shortName(this.player);
    },

    // The skill the slotted player brings to THIS position (75% on a secondary).
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
          skill: effectiveSkill(p, this.position),
          secondary: !(p.positions.primary || [p.positions.position]).includes(this.position),
        }))
        .sort((a, b) => b.skill - a.skill);
    },
  },

  methods: {
    shortName(player) {
      return `${player.firstName.charAt(0)}. ${player.lastName}`;
    },

    toggle() {
      if (!this.editable) return;
      this.open ? this.close() : this.openDropdown();
    },

    openDropdown() {
      this.open = true;
      // Defer so the opening click itself doesn't immediately close it.
      requestAnimationFrame(() => document.addEventListener('mousedown', this.onOutside));
    },

    close() {
      this.open = false;
      document.removeEventListener('mousedown', this.onOutside);
    },

    onOutside(e) {
      if (!this.$el.contains(e.target)) this.close();
    },

    pick(player) {
      this.$emit('pick', { position: this.position, slotIndex: this.slotIndex, player });
      this.close();
    },
  },

  beforeUnmount() {
    document.removeEventListener('mousedown', this.onOutside);
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
  gap: 4px;
  margin: 3px auto;
  padding: 4px 8px;
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

// Player picker dropdown, anchored below the box.
.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  width: 100%;
  min-width: 160px;
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  padding: 4px;
  gap: 2px;
  background-color: $col_120;
  border: 1px solid $col_module_border;
  border-radius: 8px;
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.45);
  cursor: default;
}

.option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 5px 8px;
  border: none;
  border-radius: 4px;
  background: transparent;
  color: $col_text;
  font-family: inherit;
  font-size: 12px;
  font-weight: 500;
  text-align: left;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.option:hover {
  background-color: $col_110;
}

.option .opt-name {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.option .opt-skill {
  flex-shrink: 0;
}

// A secondary-position option is dimmed to flag the 75% skill penalty.
.option.secondary {
  opacity: 0.6;
}

.dropdown .empty {
  padding: 6px 8px;
  font-size: 12px;
  color: $col_text_secondary;
}

</style>
