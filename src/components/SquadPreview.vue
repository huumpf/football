<template>
  <div class="squad-preview">
    <div class="formation-control">
      <div class="select-wrapper" @click="formationsOpen = !formationsOpen">
        <span class="selectFormation">
          <span class="formation-name">{{ selectedFormation ? selectedFormation.name : 'Overview' }}</span>
          <span v-if="selectedFormation" class="formation-skill"> · Total skill: {{ selectedFormation.skillSum }}</span>
        </span>
        <DropdownMenu
          v-if="formationsOpen"
          :options="formationOptions"
          @select="selectFormation"
          @close="formationsOpen = false"
        />
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
import Lineup from '@/components/Lineup.vue';
import DropdownMenu from '@/components/DropdownMenu.vue';

// Fictional formation for the Overview — every position present exactly once
// so each box can show how many drafted players play that position.
const OVERVIEW_FORMATION = {
  name: 'Overview',
  positions: { gk: 1, lb: 1, cb: 1, rb: 1, lm: 1, cdm: 1, cm: 1, cam: 1, rm: 1, lf: 1, st: 1, rf: 1 },
  layout: [
    // Central spine on x=0.5. The CB sits level with LB/RB for a flat back
    // line; the GK hugs the goal line (the compact slot's tight gutter keeps
    // the GK and CB boxes clear of each other on the narrow sidebar pitch).
    { position: 'GK', x: 0.5, y: 0.05 },
    { position: 'LB', x: 0.15, y: 0.22 },
    { position: 'CB', x: 0.5, y: 0.22 },
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
      formationsOpen: false,
    }
  },

  computed: {
    players() { return this.$store.state.team.players },
    countPerPosition() { return this.$store.state.team.positionCount },
    overviewFormation() { return OVERVIEW_FORMATION },
    formations() { return this.$store.getters.formationsWithPlayers },
    // Look the formation up by name so the selection survives the formations
    // array being recomputed after every draft pick.
    selectedFormation() {
      if (!this.selectedName) return null;
      return this.formations.find(f => f.name === this.selectedName) || null;
    },
    // Dropdown rows: "Overview" first, then formations (Name | Total Skill),
    // strongest first.
    formationOptions() {
      const overview = {
        label: 'Overview',
        value: '',
        formation: null,
        selected: !this.selectedName,
      };
      const rest = [...this.formations]
        .sort((a, b) => b.skillSum - a.skillSum)
        .map(f => ({
          label: f.name,
          value: f.skillSum,
          formation: f,
          selected: f.name === this.selectedName,
        }));
      return [overview, ...rest];
    },
  },

  methods: {
    selectFormation(option) {
      this.selectedName = option.formation ? option.formation.name : null;
      this.formationsOpen = false;
    },
  },

  components: {
    Lineup,
    DropdownMenu,
  },
}
</script>

<style lang="scss" scoped>

// Edge spacing comes from the shared card padding.
.formation-control {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
}

.lineup-preview {
  margin-top: 16px;
}

.select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
  z-index: $z_overlay;
}

// Center the formation panel under the headline instead of growing from
// its left edge.
.select-wrapper :deep(.dropdown) {
  left: 50%;
  transform: translateX(-50%);
  width: max-content;
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
  color: $col_text;
  font-size: 16px;
  text-align: center;
  padding: 4px 22px 4px 8px;
  white-space: nowrap;
}

.formation-name {
  font-weight: 600;
}

.formation-skill {
  font-weight: 300;
}

</style>
