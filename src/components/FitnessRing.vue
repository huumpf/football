<template>
  <Tooltip :text="label">
    <span class="fitness-ring" :class="tier" :style="boxStyle">
      <svg viewBox="0 0 36 36">
        <circle class="track" cx="18" cy="18" r="16" fill="none"/>
        <circle
          class="bar"
          cx="18"
          cy="18"
          r="16"
          fill="none"
          pathLength="100"
          :stroke-dasharray="`${pct} 100`"
          stroke-linecap="round"
        />
      </svg>
    </span>
  </Tooltip>
</template>

<script>
import { fitnessTier } from '../assets/js/Helpers.js';
import Tooltip from './Tooltip.vue';

// A round "loading bar" for a player's current fitness: a faint full track with
// a coloured arc filled to the value. Green above 85, yellow 40–85, red below.
// Hovering shows the exact percentage in a tooltip.
export default {
  name: 'FitnessRing',

  components: { Tooltip },

  props: {
    // Current fitness, 0..100. Null/undefined renders an empty (track-only) ring.
    value: { type: Number, default: null },
    // Rendered diameter in px.
    size: { type: Number, default: 16 },
  },

  computed: {
    pct() {
      if (this.value == null) return 0;
      return Math.max(0, Math.min(100, this.value));
    },
    tier() {
      return this.value == null ? 'low' : fitnessTier(this.value);
    },
    boxStyle() {
      return { width: `${this.size}px`, height: `${this.size}px` };
    },
    label() {
      return this.value == null ? '' : `Fitness ${Math.round(this.value)}%`;
    },
  },
}
</script>

<style lang="scss" scoped>
.fitness-ring {
  display: inline-block;
  flex-shrink: 0;
  line-height: 0;
}

svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg); // start the arc at 12 o'clock
}

circle {
  stroke-width: 4;
}

.track {
  stroke: $col_fitness_track;
}

.bar {
  transition: stroke-dasharray 0.15s linear;
}

.fitness-ring.good .bar { stroke: $col_fitness_good; }
.fitness-ring.ok .bar { stroke: $col_fitness_ok; }
.fitness-ring.low .bar { stroke: $col_fitness_low; }
</style>
