<template>
  <div class="team-grid">
    <div class="card field-card">
      <div class="formation-header">
        <h2 class="formation-title">Formation</h2>
        <div class="select-wrapper" @click="formationsOpen = !formationsOpen">
          <span v-if="selectedFormation" class="formation-name">{{ selectedFormation.name }}</span>
          <svg class="caret" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <path d="M3 6.5l5 5 5-5"/>
          </svg>
          <DropdownMenu
            v-if="formationsOpen"
            :options="formationOptions"
            @select="selectFormation"
            @close="formationsOpen = false"
          />
        </div>
      </div>

      <div class="field-wrapper">
        <Lineup
          v-if="lineupFormation"
          :formation="lineupFormation"
          editable
          :squad="players"
          @pick="placePlayer"
        />
      </div>
    </div>

    <div class="card team-card">
      <PlayerList v-if="players.length > 0" title="Squad" :players="players"/>
    </div>
  </div>

</template>

<script>
import * as HLP from '../assets/js/Helpers.js';
import Lineup from '@/components/Lineup.vue';
import PlayerList from '@/components/PlayerList.vue';
import DropdownMenu from '@/components/DropdownMenu.vue';

export default {
  name: "Team",

  data:() => {
    return {
      selectedFormation: null,
      formationsOpen: false,
      // Editable lineup for the selected formation: { pos: [player|null, …] }.
      lineup: {},
    }
  },

  created() {
    this.selectedFormation = this.recommendedFormation;
  },

  watch: {
    // (Re)build the editable lineup from the optimal assignment whenever the
    // formation changes; manual edits live on top of this starting point.
    selectedFormation: {
      immediate: true,
      handler() { this.initLineup(); },
    },
  },

  computed: {
    formations() { return this.$store.getters.formationsWithPlayers },
    players() { return this.$store.state.team.players },
    recommendedFormation() { return this.$store.getters.recommendedFormation },
    // Dropdown rows (Name | Total Skill), strongest formation first.
    formationOptions() {
      return [...this.formations]
        .sort((a, b) => b.skillSum - a.skillSum)
        .map(f => ({
          label: f.name,
          value: f.skillSum,
          formation: f,
          selected: this.selectedFormation && f.name === this.selectedFormation.name,
        }));
    },
    // Feeds Lineup from the editable assignment rather than the auto one.
    lineupFormation() {
      return this.selectedFormation
        ? {
            positions: this.selectedFormation.positions,
            layout: this.selectedFormation.layout,
            players: this.lineup,
          }
        : null;
    },
  },

  methods: {
    selectFormation(option) {
      this.selectedFormation = option.formation;
      this.formationsOpen = false;
    },

    initLineup() {
      this.lineup = this.selectedFormation
        ? HLP.assignLineup(this.players, this.selectedFormation.positions)
        : {};
    },

    // Set a player on a slot, first vacating any slot they already occupied.
    placePlayer({ position, slotIndex, player }) {
      const pos = position.toLowerCase();
      for (const key of Object.keys(this.lineup)) {
        const arr = this.lineup[key];
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] === player) arr[i] = null;
        }
      }
      if (this.lineup[pos]) this.lineup[pos][slotIndex] = player;
    },
  },

  components: {
    Lineup,
    PlayerList,
    DropdownMenu,
  }
}
</script>

<style lang="scss" scoped>

// Responsive card grid mirroring the design: the field card grows, the squad
// list takes a fluid fixed-ish track and stacks below on narrow screens.
.team-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
  height: 100%;
}

.field-card {
  // Query container so lineup items can drop the first-name initial when
  // the card gets narrow (see LineupItem.vue).
  container: formation-card / inline-size;
  display: flex;
  flex-direction: column;
  min-width: 0;
  // Visible so a slot's player-picker dropdown isn't clipped by the card
  // (the pitch itself clips to its own rounded corners).
  overflow: visible;
}

.field-wrapper {
  width: 100%;
  margin-top: 12px;
  overflow: visible;
}

.team-card {
  min-height: 0;
  overflow: auto;
}

@media screen and (max-width: $breakpoint_tablet) {
  .team-grid {
    grid-template-columns: 1fr;
    height: auto;
  }
}

// Headline row per the design: card title and formation select on one line.
.formation-header {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: $list_headline_padding;
}

.formation-title {
  font-size: 20px;
  font-weight: 500;
}

.select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding-left: 8px;
  cursor: pointer;
  // Above the lineup boxes so the open panel overlays the field.
  z-index: $z_overlay;
}

.select-wrapper :deep(.dropdown) {
  width: max-content;
}

.formation-name {
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
}

.caret {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

</style>