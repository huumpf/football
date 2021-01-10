<template>
  <div class="draft-picks-wrapper">
    <div class="bar topbar">
      <h1>Draft your team</h1>
      <p>{{ moneyToStr(currentMoney) }} € remaining</p>
    </div>
    <div class="player-cards-wrapper">
      <DraftCard
      v-for="(player, index) in activeDraftSet" 
      :key="index"
      :firstName="player.firstName"
      :lastName="player.lastName"
      :positions="player.positions"
      :skill="player.skill"
      :skills="player.skills"
      :age="player.age"
      :salary="player.salary"
      @click="addPlayerToTeam(player)"
      />
    </div>
    <div class="bar bottombar">
      <span class="number left">{{ playersInTeam }}</span>/<span class="number right">{{ draftAmount }}</span>
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
  }

  .topbar {
    border-bottom: 1px solid $col_module_border;
    padding: 30px 30px 0;
    align-items: flex-start;
  }
  @media screen and (max-width: $breakpoint_tablet) {
    .topbar {
      flex-direction: column;
      border-bottom: 1px solid $col_module_border;
      padding: 30px 30px 0;
      align-items: center;
    }}


  .topbar > * {
    background-color: $col_module_background;
    padding: 0 20px;
  }

  .bottombar {
    border-top: 1px solid $col_module_border;
    background-color: $col_module_background;
    padding: 20px 40px;
    align-items: center;
  }

  .player-cards-wrapper {
    width: 100%;
    display: flex;
    justify-content: center; 
  }
  @media screen and (max-width: $breakpoint_tablet) {
  .player-cards-wrapper {
      width: 100%;
      display: flex;
      justify-content: center;
      flex-direction: column;
      align-items: center;
      padding: 20px;
  }}

  .completion-bar {
    display: flex;
    justify-content: left;
    margin-left: 40px;
    background-color: $col_110;
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
  
  .left {
    text-align: right;
    margin-right: 10px;
  }

  .right {
    text-align: left;
    margin-left: 10px;
  }

</style>