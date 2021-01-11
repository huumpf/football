<template>
  <div class="draft-picks-wrapper">
    <div class="bar topbar">
      <h1>Draft your team</h1>
      <p>{{ moneyToStr(currentMoney) }} € remaining</p>
    </div>

    <div class="player-cards-wrapper" tag="div" name="appear" mode="out-in">
      <transition name="appear" mode="out-in">
        <DraftCard :key="activeDraftSet[0].lastName" :player="activeDraftSet[0]" @click="addPlayerToTeam(activeDraftSet[0])"/>
      </transition>
      <transition name="appear" mode="out-in">
        <DraftCard :key="activeDraftSet[1].lastName" :player="activeDraftSet[1]" @click="addPlayerToTeam(activeDraftSet[1])"/>
      </transition>
      <transition name="appear" mode="out-in">
        <DraftCard :key="activeDraftSet[2].lastName" :player="activeDraftSet[2]" @click="addPlayerToTeam(activeDraftSet[2])"/>
      </transition>
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

  created() {
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
    align-items: center;
    background-color: $col_page_background;
    min-height: 95vh;
  }

  .player-cards-wrapper {
    display: flex;
    width: 100%;
    max-width: 800px;
    padding: 30px;
    flex-direction: column;
    justify-content: center;
  }

  .bar {
    display: flex;
    justify-content: space-between;
    width: 100%;
  }

  .topbar {
    padding: 30px 30px 0;
    align-items: flex-start;
  }
  @media screen and (max-width: $breakpoint_tablet) {
    .topbar {
      flex-direction: column;
      padding: 30px 30px 0;
      align-items: center;
    }
    .player-cards-wrapper {
      padding: 20px;
    }
  }


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

  .appear-enter-active,
  .appear-leave-active {
    &, &.appear-enter-to:hover, &.appear-leave-to:hover{
    transition: all 1s ease;
}
  }
  .appear-enter-from,
  .appear-leave-to {
    opacity: 0;
    transform: translateY(30px);
  }


</style>