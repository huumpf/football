<template>
  <div class="team-wrapper">
  <h1>Choose a formation</h1>
  <p>We recommend {{ recommendedFormation.name }}</p>
    <select v-model="selectedFormation">
      <option v-for="(formation, index) in formations" :key="index" :value="formation">{{ formation.name }}</option>
    </select>

    <div class="field-wrapper">
      <Lineup :formation="selectedFormation"/>
    </div>
  </div>

</template>

<script>
const CFG = require('../assets/js/Config.js');
const HLP = require('../assets/js/Helpers.js');
import Lineup from '@/components/Lineup.vue'

export default {
  name: "Team",

  data:() => {
    return {
      selectedFormation: CFG.formations[0],
    }
  },

  computed: {
    formations() { return CFG.formations },
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
  justify-content: space-around;
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

</style>