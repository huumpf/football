<template>
  <Tooltip v-if="injuryData" multiline class="injury-icon">
    <img :src="iconSrc" :width="size" :height="size" alt="Injured"/>
    <template #bubble>
      <span class="timing">{{ timing }}</span>
      <span class="name">{{ injuryData.name }}</span>
      <span class="duration">{{ duration }}</span>
    </template>
  </Tooltip>
</template>

<script>
import Tooltip from './Tooltip.vue';
import { injuryTimingLabel, injuryDurationLabel } from '../assets/js/Helpers.js';

// The injury marker shown beside an injured player's name everywhere in the app.
// Hovering reveals when it happened, what it is, and the (vague) typical duration.
//
// Out of a match the details live on `player.injury`. During a watched match the
// injury hasn't been committed to the player yet (it is stamped only afterwards),
// so the live view passes the timeline event's injury via the `injury` prop.
export default {
  name: 'InjuryIcon',

  components: { Tooltip },

  props: {
    player: { type: Object, default: null },
    // Explicit injury data (in-match). Falls back to player.injury when omitted.
    injury: { type: Object, default: null },
    size: { type: Number, default: 14 },
  },

  computed: {
    injuryData() {
      return this.injury || (this.player && this.player.injury) || null;
    },
    iconSrc() {
      return new URL('../assets/img/icons/injury-white.svg', import.meta.url).href;
    },
    // Relative to the club's current week ("Today" / "N weeks ago"). An in-match
    // injury carries no stamped week yet, so it reads "Today".
    timing() {
      const inj = this.injuryData;
      if (!inj) return '';
      if (inj.injuredAtAbsWeek == null) return 'Today';
      return injuryTimingLabel({ injury: inj }, this.$store.state.club);
    },
    duration() {
      return injuryDurationLabel({ injury: this.injuryData });
    },
  },
};
</script>

<style lang="scss" scoped>
.injury-icon {
  align-items: center;
}

.injury-icon img {
  display: block;
  flex-shrink: 0;
}

// The three bubble lines stack; the typical-duration line reads as quiet metadata.
.timing,
.name,
.duration {
  display: block;
}

.timing {
  font-weight: 600;
}

.duration {
  margin-top: 2px;
  color: $col_text_secondary;
}
</style>
