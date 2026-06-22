<template>
  <div class="dropdown" :class="{ up }" @click.stop>
    <button
      v-for="(option, index) in options"
      :key="index"
      type="button"
      class="option"
      :class="{ secondary: option.secondary, selected: option.selected }"
      @click="$emit('select', option)"
    >
      <img v-if="option.selected" class="opt-check" src="../assets/img/icons/CheckCircle-white.svg" alt=""/>
      <span class="opt-label">{{ option.label }}</span>
      <span class="opt-value">{{ option.value }}</span>
    </button>
    <p v-if="!options.length" class="empty">{{ emptyText }}</p>
  </div>
</template>

<script>
// Anchored option panel shared by the lineup player picker and the formation
// picker. The parent toggles visibility (v-if) and positions it via its own
// relatively-positioned anchor element; the panel closes itself on any click
// outside that anchor (so a click on the trigger toggles instead of reopening).
export default {
  name: 'DropdownMenu',

  props: {
    // { label, value, secondary?, … } — the full option is echoed on select,
    // so parents can attach their payload (player, formation, …).
    options: { type: Array, required: true },
    emptyText: { type: String, default: 'No options' },
  },

  emits: ['select', 'close'],

  data: () => {
    return {
      // Flips the panel above its anchor when there's no room below.
      up: false,
    }
  },

  mounted() {
    this.flipIfClipped();
    // Defer so the opening click itself doesn't immediately close the panel.
    requestAnimationFrame(() => document.addEventListener('mousedown', this.onOutside));
  },

  beforeUnmount() {
    document.removeEventListener('mousedown', this.onOutside);
  },

  methods: {
    // Open upward when the panel wouldn't fit below the anchor within the
    // nearest clipping ancestor (e.g. the horizontally-scrolling pitch on
    // mobile, or the viewport), so a bottom-row slot's options aren't cut off.
    flipIfClipped() {
      const anchor = this.$el.parentElement;
      if (!anchor) return;
      const bound = this.clipBounds(anchor);
      const rect = anchor.getBoundingClientRect();
      const panelH = this.$el.offsetHeight + 4;
      const below = bound.bottom - rect.bottom;
      const above = rect.top - bound.top;
      this.up = below < panelH && above > below;
    },

    // Bounding rect of the nearest ancestor that clips overflow, falling back
    // to the viewport when nothing clips.
    clipBounds(el) {
      let node = el.parentElement;
      while (node && node !== document.body) {
        if (getComputedStyle(node).overflowY !== 'visible') return node.getBoundingClientRect();
        node = node.parentElement;
      }
      return { top: 0, bottom: window.innerHeight };
    },

    onOutside(e) {
      const anchor = this.$el.parentElement || this.$el;
      if (!anchor.contains(e.target)) this.$emit('close');
    },
  },
}
</script>

<style lang="scss" scoped>

// Panel anchored below the trigger box.
.dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  &.up {
    top: auto;
    bottom: calc(100% + 4px);
  }
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

// Default-formation marker, sat at the start of the row before the label.
.opt-check {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.opt-label {
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.opt-value {
  flex-shrink: 0;
}

// A secondary option (e.g. a player on a secondary position) is dimmed.
.option.secondary {
  opacity: 0.6;
}

// The currently selected option (e.g. the active formation).
.option.selected {
  color: $col_highlight;
}

.empty {
  padding: 6px 8px;
  font-size: 12px;
  color: $col_text_secondary;
}

</style>
