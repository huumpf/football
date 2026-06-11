<template>

  <div class="lineup-wrapper">
    <Field/>

    <div class="aspect" :class="{ 'aspect-compact': skillOnly }">
      <div class="aspect-wrapper-inside">
        <div class="lineup">
          <div
            v-for="(slot, index) in layoutSlots"
            :key="index"
            class="slot"
            :style="{ '--px': slot.y, '--py': slot.x }"
          >
            <LineupItem
              :position="slot.position"
              :player="slotPlayer(slot.pos, slot.slotIndex)"
              :skill-only="skillOnly"
              :count-mode="!!counts"
              :count="counts && counts[slot.pos]"
              :editable="editable"
              :squad="squad"
              :slot-index="slot.slotIndex"
              @pick="$emit('pick', $event)"
            />
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
import Field from '@/components/Field.vue'
import LineupItem from '@/components/LineupItem.vue'

export default {
  name: 'Lineup',

  props: {
    formation: Object,
    // Compact preview used during the draft: each slot shows only the skill value.
    skillOnly: Boolean,
    // When provided (Overview), boxes show the player count per position from
    // this map instead of a slotted player's skill.
    counts: {
      type: Object,
      default: null,
    },
    // Editable mode (team view): slots can be reassigned via a dropdown.
    editable: Boolean,
    // Full squad, forwarded to each slot to build its candidate list.
    squad: {
      type: Array,
      default: () => [],
    },
  },

  emits: ['pick'],

  computed: {
    // One entry per slot from the formation's layout, with its relative pitch
    // coordinate and its index within its position (2nd CB → slotIndex 1).
    layoutSlots() {
      const counters = {};
      return (this.formation.layout || []).map(entry => {
        const pos = entry.position.toLowerCase();
        const slotIndex = counters[pos] || 0;
        counters[pos] = slotIndex + 1;
        return { position: entry.position, pos, slotIndex, x: entry.x, y: entry.y };
      });
    },
  },

  methods: {
    slotPlayer(pos, index) {
      const arr = this.formation.players && this.formation.players[pos];
      return arr ? arr[index] || null : null;
    },
  },

  components: {
    Field,
    LineupItem,
  },
}
</script>

<style lang="scss" scoped>

.aspect {
  width: 100%;
  padding-top: 60%;
  margin-top: -60%;
  position: relative;
  z-index: $z_lineup;

  .aspect-wrapper-inside {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }
}

.lineup {
  position: relative;
  width: 100%;
  height: 100%;
}

// Each slot is a fixed-size box centered on its relative pitch coordinate.
// The pitch renders horizontally (own goal left), so y (back→front) maps to
// the horizontal axis and x (sideline→sideline) to the vertical one. clamp()
// keeps the box fully inside the field when a coordinate sits near an edge.
.slot {
  // Fluid box width so the lineup keeps its relative geometry on narrow
  // fields instead of the boxes colliding.
  --w: clamp(90px, 14%, 160px);
  --h: 28px;
  position: absolute;
  width: var(--w);
  height: var(--h);
  left: clamp(0%, calc(var(--px) * 100% - var(--w) / 2), calc(100% - var(--w)));
  top: clamp(0%, calc(var(--py) * 100% - var(--h) / 2), calc(100% - var(--h)));
}

.slot :deep(.player) {
  width: 100%;
  height: 100%;
  margin: 0;
}

// Compact preview (draft sidebar): boxes hug their content and center on the
// coordinate, so tightly-spaced central positions overlap less.
.aspect-compact .slot {
  --w: 62px;
  --h: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.aspect-compact .slot :deep(.player) {
  width: auto;
  height: auto;
}

</style>
