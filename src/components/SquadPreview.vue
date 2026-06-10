<template>
  <div class="squad-preview">
    <div class="formation-control">
      <div class="select-wrapper">
        <select v-model="selectedName" class="select-formation">
          <option :value="null">Overview</option>
          <option v-for="(formation, index) in formations" :key="index" :value="formation.name">
            {{ formation.name }} · {{ formation.skillSum }}
          </option>
        </select>
      </div>
    </div>

    <div class="lineup-preview">
      <!-- Overview: a fictional 1-3-3-3 with every position once, each box showing its player count -->
      <Lineup
        v-if="selectedFormation"
        :formation="selectedFormation"
        skill-only
      />
      <Lineup
        v-else
        :formation="overviewFormation"
        :counts="countPerPosition"
        skill-only
      />
    </div>
  </div>
</template>

<script>
import * as HLP from '../assets/js/Helpers.js';
import Lineup from '@/components/Lineup.vue';

// Fictional formation for the Overview — every position present exactly once
// so each box can show how many drafted players play that position.
const OVERVIEW_FORMATION = {
  name: 'Overview',
  positions: { gk: 1, lb: 1, cb: 1, rb: 1, lm: 1, cdm: 1, cm: 1, cam: 1, rm: 1, lf: 1, st: 1, rf: 1 },
  layout: [
    { position: 'GK', x: 0.5, y: 0.05 },
    { position: 'LB', x: 0.15, y: 0.22 },
    { position: 'CB', x: 0.5, y: 0.18 },
    { position: 'RB', x: 0.85, y: 0.22 },
    { position: 'CDM', x: 0.5, y: 0.36 },
    { position: 'LM', x: 0.15, y: 0.52 },
    { position: 'CM', x: 0.5, y: 0.54 },
    { position: 'RM', x: 0.85, y: 0.52 },
    { position: 'CAM', x: 0.5, y: 0.72 },
    { position: 'LF', x: 0.15, y: 0.82 },
    { position: 'ST', x: 0.5, y: 0.9 },
    { position: 'RF', x: 0.85, y: 0.82 },
  ],
  players: { gk: [], lb: [], cb: [], rb: [], lm: [], cdm: [], cm: [], cam: [], rm: [], lf: [], st: [], rf: [] },
};

export default {
  name: 'SquadPreview',

  data: () => {
    return {
      // null = "Overview" (the plain heatmap); otherwise the selected formation's name
      selectedName: null,
    }
  },

  computed: {
    players() { return this.$store.state.team.players },
    countPerPosition() { return this.$store.state.team.positionCount },
    overviewFormation() { return OVERVIEW_FORMATION },
    formations() { return HLP.getFormationsWithPlayers(this.players) },
    // Look the formation up by name so the selection survives the formations
    // array being recomputed after every draft pick.
    selectedFormation() {
      if (!this.selectedName) return null;
      return this.formations.find(f => f.name === this.selectedName) || null;
    },
  },

  components: {
    Lineup,
  },
}
</script>

<style lang="scss" scoped>

.formation-control {
  margin: 20px 20px 0;
}

.lineup-preview {
  margin: 16px 20px 20px;
}

.select-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  background-color: $col_module_background;
  border: 1px solid $col_module_border;
  border-radius: 8px;
  transition: border-color 0.15s ease;
}

.select-wrapper:hover {
  border-color: $col_cta;
}

.select-wrapper::after {
  content: "";
  position: absolute;
  right: 18px;
  width: 8px;
  height: 8px;
  margin-top: -3px;
  border-right: 2px solid $col_text_secondary;
  border-bottom: 2px solid $col_text_secondary;
  transform: rotate(45deg);
  pointer-events: none;
}

.select-formation {
  appearance: none;
  -webkit-appearance: none;
  width: 100%;
  background: transparent;
  border: none;
  outline: none;
  color: $col_text;
  font-family: inherit;
  font-size: 20px;
  font-weight: 600;
  padding: 12px 44px 12px 18px;
  cursor: pointer;
}

.select-formation option {
  background-color: $col_module_background;
  color: $col_text;
  font-size: 16px;
}

</style>
