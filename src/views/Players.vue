<template>
  <div class="players-wrapper">
    <div class="card list-card">
      <PlayerList
        title="Squad"
        :players="players"
        :listed-ids="listedIds"
        show-salary
        show-value
        show-development
        :timeframe="devTimeframe"
        action-width="24px"
      >
        <template #header-actions>
          <div class="timeframe-menu" :class="{ open }">
            <button
              type="button"
              class="dots-btn"
              aria-label="Skill-change timeframe"
              title="Skill-change timeframe"
              @click="open = !open"
            >
              <img src="../assets/img/icons/dots-white.svg" alt=""/>
            </button>
            <DropdownMenu
              v-if="open"
              heading="Player development"
              :options="timeframeOptions"
              @select="onSelect"
              @close="open = false"
            />
          </div>
        </template>

        <template #actions="{ player }">
          <PlayerRowMenu :player="player"/>
        </template>
      </PlayerList>
    </div>
  </div>
</template>

<script>
import PlayerList from '../components/PlayerList.vue';
import PlayerRowMenu from '../components/PlayerRowMenu.vue';
import DropdownMenu from '../components/DropdownMenu.vue';
import { DEV_TIMEFRAMES } from '../assets/js/Config.js';

export default {
  name: 'Players',

  components: {
    PlayerList,
    PlayerRowMenu,
    DropdownMenu,
  },

  data: () => ({ open: false }),

  computed: {
    players() { return this.$store.state.team.players },
    listedIds() { return this.$store.getters.listedPlayerIds },
    devTimeframe() { return this.$store.state.team.devTimeframe },

    timeframeOptions() {
      return DEV_TIMEFRAMES.map(t => ({
        label: t.label,
        action: t.key,
        selected: t.key === this.devTimeframe,
      }));
    },
  },

  methods: {
    onSelect(option) {
      this.$store.commit('SET_DEV_TIMEFRAME', option.action);
      this.open = false;
    },
  },
}
</script>

<style lang="scss" scoped>

// Full-width, card-based; the list grows with the viewport.
.players-wrapper {
  padding: 12px;
}

// Sized to the columns (position, name, skill, dev, age, salary, value, menu).
.list-card {
  max-width: 660px;
  margin: 0 auto;
  overflow: visible;
}

// Anchor for the timeframe flyout, opened right-aligned under the dots button.
.timeframe-menu {
  position: relative;
}

.timeframe-menu.open {
  z-index: $z_overlay;
}

.timeframe-menu :deep(.dropdown) {
  left: auto;
  right: 0;
  width: auto;
}

.dots-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  padding: 0;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  transition: background-color 0.1s ease;
}

.dots-btn:hover {
  background-color: $col_module_border;
}

.dots-btn img {
  display: block;
  width: 16px;
  height: 16px;
}

</style>
