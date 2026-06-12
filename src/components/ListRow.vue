<template>
  <div class="list-row" :class="{ header }">
    <slot/>
  </div>
</template>

<script>
export default {
  name: 'ListRow',

  props: {
    // Column-label row: hairline divider, secondary color, no zebra stripe.
    header: { type: Boolean, default: false },
  },
}
</script>

<style lang="scss" scoped>

// Single source of truth for list lines: every row in every list shares the
// same height, horizontal padding and column gap.
.list-row {
  display: flex;
  align-items: center;
  width: 100%;
  padding: $list_row_padding;
  gap: $list_row_gap;
  border-radius: 4px;
  font-size: 12px;
  text-align: left;
}

.header {
  height: 41px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.5);
}

// Zebra striping: rows sit flush and alternate against the card surface.
.list-row:not(.header):nth-of-type(even) {
  background-color: $col_row_alternate;
}

</style>
