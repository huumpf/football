<template>
  <div class="team-grid">
    <div class="card field-card">
      <div class="formation-control">
        <div class="select-wrapper">
          <select v-model="selectedFormation" class="selectFormation">
            <option v-for="(formation, index) in formations" :key="index" :value="formation">{{ formation.name }} · {{ formation.skillSum }}</option>
          </select>
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
      <PlayerList v-if="players.length > 0" :players="players" compact/>
    </div>
  </div>

</template>

<script>
import * as HLP from '../assets/js/Helpers.js';
import Lineup from '@/components/Lineup.vue';
import PlayerList from '@/components/PlayerList.vue';

export default {
  name: "Team",

  data:() => {
    return {
      selectedFormation: null,
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
    formations() { return HLP.getFormationsWithPlayers(this.$store.state.team.players) },
    players() { return this.$store.state.team.players },
    recommendedFormation() { return HLP.getRecommendedFormation(this.$store.state.team.players) },
    // Feeds Lineup from the editable assignment rather than the auto one.
    lineupFormation() {
      return this.selectedFormation
        ? { positions: this.selectedFormation.positions, players: this.lineup }
        : null;
    },
  },

  methods: {
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
  }
}
</script>

<style lang="scss" scoped>

// Responsive card grid mirroring the design: the field card grows, the squad
// list takes a fluid fixed-ish track and stacks below on narrow screens.
.team-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(300px, 26%, 380px);
  gap: 12px;
  padding: 12px;
  height: 100%;
}

.field-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
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

// Minimal formation selector centered at the top of the field card.
.formation-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.select-wrapper::after {
  content: "";
  position: absolute;
  right: 6px;
  width: 7px;
  height: 7px;
  margin-top: -3px;
  border-right: 2px solid $col_text;
  border-bottom: 2px solid $col_text;
  transform: rotate(45deg);
  pointer-events: none;
}

.selectFormation {
  appearance: none;
  -webkit-appearance: none;
  background: transparent;
  border: none;
  outline: none;
  color: $col_text;
  font-family: inherit;
  font-size: 16px;
  font-weight: 500;
  text-align: center;
  text-align-last: center;
  padding: 4px 22px 4px 8px;
  cursor: pointer;
}

.selectFormation option {
  background-color: $col_module_background;
  color: $col_text;
  font-size: 14px;
}

</style>