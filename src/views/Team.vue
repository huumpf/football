<template>
  
  <div class="team-wrapper">
    <select class="formation-select">
      <option v-for="(formation, index) in formations" :key="index">{{ formation.name }}</option>
    </select>
  </div>

  <Lineup />

</template>

<script>
const CFG = require('../assets/js/Config.js');
import Lineup from '@/components/Lineup.vue'

export default {
  name: "Team",
  
  computed: {
    formations() { return CFG.formations },
  },

  components: {
    Lineup,
  }
}
</script>