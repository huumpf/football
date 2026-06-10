<template>

  <div class="lineup-wrapper">
    <Field/>

    <div class="aspect" :class="{ 'aspect-compact': skillOnly }">
      <div class="aspect-wrapper-inside">
        <div class="lineup">
          <div v-for="col in visibleColumns" :key="col.key" :class="col.key">
            <template v-for="pos in col.positions" :key="pos">
              <LineupItem
                v-for="index in formation.positions[pos]"
                :key="pos + index"
                :position="pos.toUpperCase()"
                :player="slotPlayer(pos, index - 1)"
                :skill-only="skillOnly"
                :count-mode="!!counts"
                :count="counts && counts[pos]"
                :editable="editable"
                :squad="squad"
                :slot-index="index - 1"
                @pick="$emit('pick', $event)"
              />
            </template>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
import Field from '@/components/Field.vue'
import LineupItem from '@/components/LineupItem.vue'

// Visual columns of the pitch, left to right. Each maps to one of the layout
// classes the stylesheet positions; cdm/cam columns are skipped when a
// formation has no such slots.
const COLUMNS = [
  { key: 'goalkeeper', positions: ['gk'] },
  { key: 'defense', positions: ['lb', 'cb', 'rb'] },
  { key: 'cdm', positions: ['cdm'] },
  { key: 'midfield', positions: ['lm', 'cm', 'rm'] },
  { key: 'cam', positions: ['cam'] },
  { key: 'offense', positions: ['lf', 'st', 'rf'] },
];

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
    // Editable mode (Aufstellung): slots can be reassigned via a dropdown.
    editable: Boolean,
    // Full squad, forwarded to each slot to build its candidate list.
    squad: {
      type: Array,
      default: () => [],
    },
  },

  emits: ['pick'],

  computed: {
    visibleColumns() {
      return COLUMNS.filter(col =>
        col.positions.some(pos => (this.formation.positions[pos] || 0) > 0)
      );
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
  z-index: 100000;

  .aspect-wrapper-inside {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }
}

.lineup {
  width: 100%;
  height: 100%;
  display: flex;
}

.goalkeeper, .defense, .cdm, .midfield, .cam, .offense {
  flex-grow: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  padding: 10px 8px;
}

// Compact preview (draft sidebar): tighten spacing.
.aspect-compact {
  .goalkeeper, .defense, .cdm, .midfield, .cam, .offense {
    padding: 6px 2px;
  }
}

</style>
