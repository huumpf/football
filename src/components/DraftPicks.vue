<template>
  <div class="draft-picks-wrapper">
    <div class="bar topbar">
      <h1>Draft your team</h1>
      <p>{{ moneyToStr(currentMoney) }} € remaining</p>
    </div>
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
    <div class="bar bottombar">
      <span class="number">{{ playersInTeam }}</span> / <span class="number">{{ draftAmount }}</span>
      <div class="completion-bar">
        <div class="completion-amount" :style="{ width: draftCompleted*100 + '%' }"/>
      </div>
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
    draftAmount() { return this.$store.state.draft.draftAmount },
    playersInTeam() { return this.$store.state.team.players.length },
    draftCompleted() { return this.playersInTeam / this.draftAmount }
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
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    background-color: $col_page_background;
  }

  .bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 40px;
    background-color: $col_module_background;
  }

  .player-cards {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .completion-bar {
    display: flex;
    justify-content: left;
    margin-left: 40px;
    background-color: $col_page_background_secondary;
    height: 10px;
    border-radius: 5px;
    flex-grow: 1;
  }

  .completion-amount {
    height: 100%;
    background-color: $col_cta;
    border-radius: 5px;
    transition: width 0.5s ease-out;
  }

  .number {
    width: 20px;
  }

</style>