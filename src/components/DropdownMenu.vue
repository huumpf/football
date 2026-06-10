<template>
  <div class="dropdown" @click.stop>
    <button
      v-for="(option, index) in options"
      :key="index"
      type="button"
      class="option"
      :class="{ secondary: option.secondary }"
      @click="$emit('select', option)"
    >
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
    emptyText: { type: String, default: 'Keine Optionen' },
  },

  emits: ['select', 'close'],

  mounted() {
    // Defer so the opening click itself doesn't immediately close the panel.
    requestAnimationFrame(() => document.addEventListener('mousedown', this.onOutside));
  },

  beforeUnmount() {
    document.removeEventListener('mousedown', this.onOutside);
  },

  methods: {
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

.opt-label {
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

.empty {
  padding: 6px 8px;
  font-size: 12px;
  color: $col_text_secondary;
}

</style>
