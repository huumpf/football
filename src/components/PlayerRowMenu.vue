<template>
  <!-- @pointerdown.stop so pressing the button on a draggable row (Team bench/
       reserve) doesn't start a player drag; a plain click still toggles. -->
  <div class="row-menu" :class="{ open }" @pointerdown.stop>
    <button
      type="button"
      class="dots-btn"
      aria-label="Player actions"
      @click="open = !open"
    >
      <img src="../assets/img/icons/dots-white.svg" alt=""/>
    </button>
    <DropdownMenu
      v-if="open"
      :options="menuOptions"
      @select="onSelect"
      @close="open = false"
    />
  </div>
</template>

<script>
import DropdownMenu from './DropdownMenu.vue';

export default {
  name: 'PlayerRowMenu',

  components: {
    DropdownMenu,
  },

  props: {
    player: { type: Object, required: true },
  },

  data: () => {
    return {
      open: false,
    }
  },

  computed: {
    listedIds() { return this.$store.getters.listedPlayerIds },
    canList() { return this.$store.getters.canListPlayer },

    menuOptions() {
      if (this.listedIds.has(this.player.id)) {
        return [{ label: 'Remove from market', action: 'unlist' }];
      }
      if (!this.canList) {
        // The squad may not drop below the minimum if every offer sells.
        return [{ label: 'Squad at minimum size', secondary: true }];
      }
      return [{ label: 'Offer on transfer market', action: 'list' }];
    },
  },

  methods: {
    onSelect(option) {
      if (option.action === 'list') this.$store.dispatch('listPlayer', this.player);
      if (option.action === 'unlist') this.$store.dispatch('unlistPlayer', this.player);
      this.open = false;
    },
  },
}
</script>

<style lang="scss" scoped>

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
