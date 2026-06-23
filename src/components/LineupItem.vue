<template>
  <div
    class="player"
    :class="{ 'skill-only': skillOnly, editable, open, dragging: isDragging }"
    :data-player-id="editable && player ? player.id : null"
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
      <FitnessRing v-if="player" class="fitness" :value="player.fitness" :size="14"/>
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
import { effectiveSkill, fieldSkill } from '../assets/js/Helpers.js';
import DropdownMenu from '@/components/DropdownMenu.vue';
import FitnessRing from '@/components/FitnessRing.vue';

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
    // Id of the player currently being dragged, so the slot it was picked up
    // from renders at half opacity while it floats under the cursor.
    draggingId: {
      type: [String, Number],
      default: null,
    },
  },

  data: () => {
    return {
      open: false,
    }
  },

  computed: {
    // The skill the slotted player brings to THIS position: full on a primary,
    // reduced on a secondary, halved when forced onto a foreign position.
    skillValue() {
      return this.player ? fieldSkill(this.player, this.position) : null;
    },

    // Half-opacity source while this slot's player is the one being dragged.
    isDragging() {
      return this.editable && this.player != null && this.draggingId != null
        && this.player.id === this.draggingId;
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
          secondary: !(p.positions.primary || [p.positions.position]).includes(this.position),
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
    FitnessRing,
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

// On a small pitch (mobile, or the narrow one-column layout) the paddings and
// gaps eat most of a card's width, leaving almost nothing for the name. Tighten
// them so the name keeps a usable column.
@container formation-card (max-width: 860px) {
  .player:not(.skill-only) {
    gap: 3px;
    padding: 4px 5px;

    .info {
      gap: 4px;
    }
  }
}

// Clickable when the lineup is editable.
.player.editable {
  cursor: pointer;
  transition: background-color 0.12s ease;
}

// Draggable field pill: claim touch gestures so a drag doesn't scroll the page,
// and dim the slot the player was picked up from while the ghost is in flight.
.player[data-player-id] {
  touch-action: none;
}

.player.dragging {
  opacity: 0.5;
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
  padding: 3px 4px;
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
