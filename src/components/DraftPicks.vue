<template>
  <div class="draft-picks">
    <div class="card header-card">
      <h1>Draft your team</h1>
      <p class="remaining">{{ moneyToStr(currentMoney) }} € remaining</p>
    </div>

    <div class="player-cards-wrapper">
      <DraftCard
        v-for="player in activeDraftSet"
        :key="player.id"
        :player="player"
        @click="addPlayerToTeam(player)"
      />

      <div class="reroll-line">
        <Button v-if="canReroll" border @click="reroll">Reroll</Button>
        <span class="reroll-info">{{ rerollLabel }}</span>
      </div>
    </div>

    <div class="card progress-card">
      <span class="number left">{{ playersInTeam }}</span>/<span class="number right">{{ draftAmount }}</span>
      <div class="completion-bar">
        <div class="completion-amount" :style="{ width: draftCompleted*100 + '%' }"/>
      </div>
    </div>
  </div>
</template>

<script>
import DraftCard from '../components/DraftCard.vue';
import Button from '../components/Button.vue';
import * as Helpers from '../assets/js/Helpers.js';
import * as CFG from '../assets/js/Config.js';

export default {
  name: 'DraftPicks',

  components: {
    DraftCard,
    Button,
  },

  computed: {
    currentMoney() { return this.$store.state.club.money },
    activeDraftSet() { return this.$store.state.draft.activeDraftSet },
    draftAmount() { return CFG.DRAFT_COUNT },
    playersInTeam() { return this.$store.state.team.players.length },
    draftCompleted() { return this.playersInTeam / this.draftAmount },
    rerollsRemaining() { return this.$store.state.draft.rerollsRemaining },
    canReroll() { return this.rerollsRemaining > 0 },
    rerollLabel() { return this.canReroll ? `${this.rerollsRemaining} remaining` : 'No rerolls left' },
  },

  created() {
    this.$store.dispatch('makeDraftSet');
  },

  methods: {
    addPlayerToTeam(player) {
      this.$store.dispatch('addPlayerToTeam', player);
      this.$store.dispatch('pay', player.salary);
      this.$store.dispatch('makeDraftSet');
    },
    reroll() {
      this.$store.dispatch('reroll');
    },
    moneyToStr(amount) { 
      return Helpers.moneyStr(amount);
    },
  },
}
</script>

<style lang="scss" scoped>

  // Stacked cards that fill the main column of the draft grid.
  .draft-picks {
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-height: 0;
  }

  // The draft cards grow to fill the space between header and progress.
  // No gap here: each DraftCard carries its own vertical margin.
  // Constrained to the pre-rework width and centered in the main column.
  .player-cards-wrapper {
    display: flex;
    flex: 1 1 auto;
    flex-direction: column;
    justify-content: center;
    width: 100%;
    max-width: 800px;
    align-self: center;
  }

  // Reroll action sitting directly under the draft cards.
  .reroll-line {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 12px;
    margin-top: 16px;
  }

  .reroll-info {
    font-size: 14px;
    color: $col_text_secondary;
  }

  .header-card {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
    padding: 20px 30px;
  }

  .remaining {
    font-size: 20px;
    color: $col_text_secondary;
    white-space: nowrap;
  }

  .progress-card {
    display: flex;
    align-items: center;
    padding: 20px 30px;
  }

  @media screen and (max-width: $breakpoint_tablet) {
    .header-card {
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }
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

</style>