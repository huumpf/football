<template>
  <div class="team-wrapper">
    <div class="bar topbar">
      <h1 class="title">Choose a formation</h1>

      <!-- TODO: temporary — remove once a proper game-flow reset exists -->
      <button class="restart-btn" @click="restartGame">↻ Restart</button>

      <div class="formation-control">
        <div class="select-wrapper">
          <select v-model="selectedFormation" class="selectFormation">
            <option v-for="(formation, index) in formations" :key="index" :value="formation">{{ formation.name }} · {{ formation.skillSum }}</option>
          </select>
        </div>
        <p class="recommendation">
          <span v-if="isRecommended" class="recommended-tag">✓ Recommended formation</span>
          <span v-else>We recommend <strong>{{ recommendedFormation.name }}</strong></span>
        </p>
      </div>
    </div>

    <div class="field-wrapper">
      <Lineup v-if="selectedFormation" :formation="selectedFormation"/>
    </div>
  </div>

</template>

<script>
import * as HLP from '../assets/js/Helpers.js';
import Lineup from '@/components/Lineup.vue';

export default {
  name: "Team",

  data:() => {
    return {
      selectedFormation: null,
    }
  },

  created() {
    this.selectedFormation = this.recommendedFormation;
  },

  methods: {
    // TODO: temporary — full reload wipes the in-memory store and starts a fresh draft
    restartGame() {
      window.location.assign('/');
    },
  },

  computed: {
    formations() { return HLP.getFormationsWithPlayers(this.$store.state.team.players) },
    players() { return this.$store.state.team.players },
    recommendedFormation() { return HLP.getRecommendedFormation(this.$store.state.team.players) },
    isRecommended() { return this.selectedFormation && this.recommendedFormation && this.selectedFormation.name === this.recommendedFormation.name },
  },

  components: {
    Lineup,
  }
}
</script>

<style lang="scss" scoped>

.team-wrapper {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  max-width: 100vw;
  overflow: hidden;
}

.field-wrapper {
  width: 100%;
  padding: 30px;
  max-width: 1200px;
  min-width: 800px;
  overflow: auto;
}

.bar {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.topbar {
  padding: 30px 30px 0;
  align-items: center;
  margin-bottom: 40px;
  gap: 20px;
}

.title {
  background-color: $col_module_background;
  padding: 10px 24px;
  border-radius: 8px;
  color: $col_text;
  white-space: nowrap;
}

.restart-btn {
  background-color: $col_text;
  color: $col_module_background;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-family: inherit;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: transform 0.1s ease-out, opacity 0.15s ease;
}

.restart-btn:hover {
  transform: scale(1.03);
  opacity: 0.9;
}

.formation-control {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 8px;
}

.select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  background-color: $col_module_background;
  border: 1px solid $col_module_border;
  border-radius: 8px;
  transition: transform 0.1s ease-out, border-color 0.15s ease;
}

.select-wrapper:hover {
  transform: scale(1.01);
  border-color: $col_cta;
}

.select-wrapper::after {
  content: "";
  position: absolute;
  right: 20px;
  width: 9px;
  height: 9px;
  margin-top: -3px;
  border-right: 2px solid $col_text_secondary;
  border-bottom: 2px solid $col_text_secondary;
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
  font-size: 28px;
  font-weight: 600;
  padding: 12px 56px 12px 24px;
  cursor: pointer;
}

.selectFormation option {
  background-color: $col_module_background;
  color: $col_text;
  font-size: 18px;
}

.recommendation {
  font-size: 18px;
  color: $col_text_secondary;
  padding-right: 4px;
}

.recommendation strong {
  color: $col_text;
  font-weight: 600;
}

.recommended-tag {
  color: $col_cta;
  font-weight: 600;
}

@media screen and (max-width: $breakpoint_tablet) {
  .topbar {
    flex-direction: column;
    align-items: center;
  }
  .formation-control {
    align-items: center;
  }
}

</style>