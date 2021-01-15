<template>
  <div class="team-wrapper">
    <div class="bar topbar">
      <h1>Choose a formation</h1>
      <select v-model="selectedFormation" class="selectFormation">
        <option v-for="(formation, index) in formations" :key="index" :value="formation">{{ formation.name }} ({{ formation.skillSum }})     </option>
      </select>
      <p>We recommend {{ recommendedFormation.name }}</p>
    </div>

    <div class="field-wrapper">
      <Lineup :formation="selectedFormation"/>
    </div>
  </div>

</template>

<script>
const CFG = require('../assets/js/Config.js');
const HLP = require('../assets/js/Helpers.js');
import Lineup from '@/components/Lineup.vue';

export default {
  name: "Team",

  data:() => {
    return {
      selectedFormation: CFG.formations[0],
    }
  },

  computed: {
    formations() { return HLP.getFormationsWithPlayers(this.$store.state.team.players) },
    players() { return this.$store.state.team.players },
    recommendedFormation() { return HLP.getRecommendedFormation(this.$store.state.team.players) },
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

.selectFormation {
  font-size: 30px;
  width: 200px;
}

.bar {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.topbar {
  padding: 30px 30px 0;
  align-items: flex-start;
  margin-bottom: 40px;
}

.topbar > * {
  background-color: $col_module_background;
  padding: 0 20px;
  color: white;
}

</style>