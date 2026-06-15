<template>
  <button class="button" :class="{ bordered: border }">
    <slot/>
  </button>
</template>

<script>
export default {
  name: 'Button',

  props: {
    // Adds a faint outline in the faded module-background colour.
    border: {
      type: Boolean,
      default: false,
    },
  },
}
</script>

<style lang="scss" scoped>

// Low-emphasis button matching the league pager arrows: a faded label and no
// fill at rest, brightening with a faint background on hover. The transparent
// 1px border keeps the box size identical whether or not `border` is set.
.button {
  padding: 6px 16px;
  border: 1px solid transparent;
  border-radius: 999px;
  background: none;
  color: $col_text_faded;
  font-family: inherit;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease;
}

.button:hover {
  color: $col_text;
  background-color: $col_190_t10;
}

// Optional outline in the faded module-background colour.
.button.bordered {
  border-color: $col_module_background_faded;
}

</style>
