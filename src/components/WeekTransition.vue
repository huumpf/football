<template>
  <div class="week-transition" @animationend="onAnimationEnd">
    <span class="eyebrow">{{ eyebrow }}</span>
    <div class="count">
      <span>{{ label }}</span>
      <span class="roller"><span class="roller-col"><span>{{ from }}</span><span>{{ to }}</span></span></span>
    </div>
    <div class="track"><div class="fill"></div></div>
  </div>
</template>

<script>
export default {
  name: 'WeekTransition',

  props: {
    from: { type: Number, required: true },
    to: { type: Number, required: true },
    // 'week' for a normal advance, 'season' when week 52 rolls into a new season.
    mode: { type: String, default: 'week' },
  },

  emits: ['midpoint', 'finished'],

  computed: {
    eyebrow() {
      return this.mode === 'season' ? 'Loading next season' : 'Loading next week';
    },
    label() {
      return this.mode === 'season' ? 'Season' : 'Week';
    },
  },

  // Swap the underlying screen's week while it's fully covered, so the reveal
  // already shows the new week. The target (`to`) was captured before this, so
  // the overlay label stays stable even as the screen behind it mutates.
  mounted() {
    this.midpointTimer = setTimeout(() => this.$emit('midpoint'), 800);
  },

  beforeUnmount() {
    clearTimeout(this.midpointTimer);
  },

  methods: {
    onAnimationEnd(e) {
      // Only the overlay's own fade (the last animation to finish) ends the
      // transition; ignore the roller and bar animations bubbling up from
      // children, which finish earlier.
      if (e.target === this.$el) this.$emit('finished');
    },
  },
}
</script>

<style lang="scss" scoped>
.week-transition {
  position: absolute;
  inset: 0;
  z-index: $z_transition;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 22px;
  // Overlay tint derived from the page-background green.
  background: rgba($col_page_background, 0.62);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  animation: wt-fade 1600ms ease forwards;
}

.eyebrow {
  font-family: $font_body;
  font-size: 13px;
  font-weight: 700;
  line-height: 1;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: $col_highlight;
}

// "Week" plus the rolling number share the display face at splash size.
.count {
  display: flex;
  align-items: baseline;
  gap: 16px;
  font-family: $font_heading;
  font-weight: 700;
  font-size: clamp(64px, 12vw, 96px);
  line-height: 1.05;
  color: $col_text;
}

// A one-row viewport over two stacked numbers; the column slides up one row.
.roller {
  display: inline-block;
  height: 0.92em;
  line-height: 0.92;
  overflow: hidden;
}

.roller-col {
  display: flex;
  flex-direction: column;
  animation: wt-roll 700ms cubic-bezier(0.22, 1, 0.36, 1) 480ms both;
}

.roller-col > span {
  height: 0.92em;
}

.track {
  width: 260px;
  height: 6px;
  border-radius: 999px;
  background: rgba($col_text, 0.2);
  overflow: hidden;
}

.fill {
  height: 100%;
  width: 0;
  border-radius: 999px;
  background: $col_highlight;
  animation: wt-bar 1240ms cubic-bezier(0.65, 0, 0.35, 1) 120ms forwards;
}

@keyframes wt-fade {
  0% { opacity: 0; }
  13% { opacity: 1; }
  82% { opacity: 1; }
  100% { opacity: 0; }
}

@keyframes wt-roll {
  0% { transform: translateY(0); }
  100% { transform: translateY(-0.92em); }
}

@keyframes wt-bar {
  0% { width: 0; }
  100% { width: 100%; }
}
</style>
