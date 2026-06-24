<template>
  <span class="tooltip-host">
    <slot/>
    <span
      v-if="text || $slots.bubble"
      class="tooltip-bubble"
      :class="{ multiline }"
      role="tooltip"
    ><slot name="bubble">{{ text }}</slot></span>
  </span>
</template>

<script>
// A lightweight hover tooltip: wraps its trigger element in the default slot and
// shows `text` in a small bubble above it on hover (or keyboard focus). Reusable
// anywhere a short label-on-hover is wanted.
export default {
  name: 'Tooltip',

  props: {
    // The tooltip text. Empty (and no `bubble` slot) renders no bubble.
    text: { type: String, default: '' },
    // Allow a wider, wrapping, left-aligned bubble for rich multi-line content
    // (e.g. the injury tooltip). Single-line plain-text tooltips leave this off.
    multiline: { type: Boolean, default: false },
  },
}
</script>

<style lang="scss" scoped>
.tooltip-host {
  position: relative;
  display: inline-flex;
}

.tooltip-bubble {
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  z-index: $z_overlay;
  padding: 3px 7px;
  border-radius: 4px;
  white-space: nowrap;
  background-color: $col_1800;
  color: $col_190;
  font-family: $font_body;
  font-size: 11px;
  font-weight: 500;
  line-height: 1.2;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.12s ease;
}

// Rich content: a wider bubble that wraps and reads left-aligned.
.tooltip-bubble.multiline {
  white-space: normal;
  width: max-content;
  max-width: 180px;
  text-align: left;
}

.tooltip-host:hover .tooltip-bubble,
.tooltip-host:focus-within .tooltip-bubble {
  opacity: 1;
}
</style>
