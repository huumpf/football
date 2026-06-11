<template>
  <div class="players-wrapper">
    <div class="card list-card">
      <PlayerList
        :players="players"
        :listed-ids="listedIds"
        compact
        show-salary
        show-value
      >
        <template #actions="{ player }">
          <div class="row-menu" :class="{ open: openMenuId === player.id }">
            <button
              type="button"
              class="dots-btn"
              aria-label="Player actions"
              @click="toggleMenu(player)"
            >
              <img src="../assets/img/icons/dots-white.svg" alt=""/>
            </button>
            <DropdownMenu
              v-if="openMenuId === player.id"
              :options="menuOptions(player)"
              @select="onMenuSelect(player, $event)"
              @close="openMenuId = null"
            />
          </div>
        </template>
      </PlayerList>
    </div>
  </div>
</template>

<script>
import PlayerList from '../components/PlayerList.vue';
import DropdownMenu from '../components/DropdownMenu.vue';

export default {
  name: 'Players',

  components: {
    PlayerList,
    DropdownMenu,
  },

  data: () => {
    return {
      openMenuId: null,
    }
  },

  computed: {
    players() { return this.$store.state.team.players },
    listedIds() { return this.$store.getters.listedPlayerIds },
    canList() { return this.$store.getters.canListPlayer },
  },

  methods: {
    toggleMenu(player) {
      this.openMenuId = this.openMenuId === player.id ? null : player.id;
    },

    menuOptions(player) {
      if (this.listedIds.has(player.id)) {
        return [{ label: 'Remove from market', action: 'unlist' }];
      }
      if (!this.canList) {
        // The squad may not drop below the minimum if every offer sells.
        return [{ label: 'Squad at minimum size', secondary: true }];
      }
      return [{ label: 'Offer on transfer market', action: 'list' }];
    },

    onMenuSelect(player, option) {
      if (option.action === 'list') this.$store.dispatch('listPlayer', player);
      if (option.action === 'unlist') this.$store.dispatch('unlistPlayer', player);
      this.openMenuId = null;
    },
  },
}
</script>

<style lang="scss" scoped>

// Full-width, card-based; the list grows with the viewport.
.players-wrapper {
  padding: 12px;
}

// Sized to the columns (position, name, skill, age, salary, value, menu).
.list-card {
  max-width: 640px;
  margin: 0 auto;
  overflow: visible;
}

// Anchor for the dropdown panel, which opens right-aligned under the button.
.row-menu {
  position: relative;
}

// Above the positioned anchors of the following rows while the panel is open.
.row-menu.open {
  z-index: $z_overlay;
}

.row-menu :deep(.dropdown) {
  left: auto;
  right: 0;
  width: auto;
}

.dots-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
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
  width: 14px;
  height: 14px;
}

</style>
