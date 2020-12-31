<template>
  <div class="draft-picks-wrapper">
    <h1>Pick a player</h1>
    <p>{{ moneyToStr(currentMoney) }} € remaining</p>
    <div class="player-cards">
      <DraftCard
      v-for="(player, index) in activeDraftSet" 
      :key="index"
      :firstName="player.firstName"
      :lastName="player.lastName"
      :position="player.position"
      :skill="player.skill"
      :age="player.age"
      :salary="player.salary"
      @click="addPlayerToTeam(player)"
      />
    </div>
  </div>
</template>

<script>
import DraftCard from '../components/DraftCard.vue';
const Helpers = require('../assets/js/Helpers.js');

export default {
  name: 'DraftPicks',
  
  components: {
    DraftCard,
  },

  computed: {
    currentMoney() { return this.$store.state.club.money },
    activeDraftSet() { return this.$store.state.draft.activeDraftSet },
  },

  mounted() {
    this.$store.dispatch('makeDraftSet');
  },

  methods: {
    pay(amount) {
      this.$store.dispatch('pay', amount);
    },
    addPlayerToTeam(player) {
      this.$store.dispatch('addPlayerToTeam', player);
      this.$store.dispatch('pay', player.salary);
      this.$store.dispatch('makeDraftSet');
    },
    moneyToStr(amount) { 
      return Helpers.moneyStr(amount);
    },
  },
}
</script>

<style lang="scss" scoped>

  .draft-picks-wrapper {
    height: 100vh;
    padding: 20px;
    background-color: $col_page_background_secondary;
  }

  .player-cards {
    width: 100%;
    display: flex;
    justify-content: center;
  }

</style>