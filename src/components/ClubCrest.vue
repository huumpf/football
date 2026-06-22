<template>
  <span class="club-crest" :style="boxStyle" v-html="svg"></span>
</template>

<script>
import { crestToSvg } from '@/assets/js/CrestFactory.js';

export default {
  name: 'ClubCrest',

  props: {
    // The stored crest descriptor; null while a league hasn't been generated yet.
    crest: { type: Object, default: null },
    // Suffix for the SVG's clipPath id — must be unique among crests on the page.
    id: { type: [String, Number], required: true },
    size: { type: Number, default: 24 },
  },

  computed: {
    svg() { return this.crest ? crestToSvg(this.crest, this.id) : ''; },
    boxStyle() { return { width: `${this.size}px`, height: `${this.size}px` }; },
  },
}
</script>

<style lang="scss" scoped>
.club-crest {
  display: inline-block;
  flex-shrink: 0;
  line-height: 0;
}

// The injected SVG carries only a viewBox; the wrapper sets its rendered size.
.club-crest :deep(svg) {
  width: 100%;
  height: 100%;
  display: block;
}
</style>
