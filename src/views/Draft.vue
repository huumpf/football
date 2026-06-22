<template>
  <div class="draft-grid">
    <DraftPicks class="main-col"/>
    <div class="side-col">
      <SquadPreview class="card squad-card"/>
      <TeamList class="team-card"/>
    </div>
  </div>
</template>

<script>
import DraftPicks from '@/components/DraftPicks.vue'
import SquadPreview from '@/components/SquadPreview.vue'
import TeamList from '@/components/TeamList.vue'
import * as CFG from '@/assets/js/Config.js'

export default {
  name: 'Draft',

  components: {
    DraftPicks,
    SquadPreview,
    TeamList,
  },

  created() {
    // A finished draft can't be reopened: redirect instead of re-rolling the
    // league and offering picks beyond the draft limit.
    if (this.draftIsCompleted) {
      this.$router.replace({ name: 'Team' });
      return;
    }
    this.$store.dispatch('makeLeague');
  },

  computed: {
    draftIsCompleted() { return this.$store.state.team.players.length >= CFG.DRAFT_COUNT }
  },

  watch: {
    draftIsCompleted: function () {
      // Fill every formation's team sheet once, now the squad is complete.
      this.$store.dispatch('initFormations');
      this.$router.push({ name: "Team" });
    }
  }
}
</script>

<style lang="scss" scoped>

// Responsive card grid: the picks column grows, the sidebar takes a fluid
// fixed-ish track. Both fill the viewport height so the team list scrolls
// inside its own card.
.draft-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(300px, 26%, 380px);
  gap: 12px;
  padding: 12px;
  height: 100%;
}

.main-col {
  min-height: 0;
}

.side-col {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 0;
}

.squad-card {
  flex-shrink: 0;
  overflow: hidden;
}

// Takes the remaining height; the list scrolls within it.
.team-card {
  flex: 1 1 auto;
  min-height: 0;
}

// Stack into a single, naturally-flowing column on narrow screens.
@media screen and (max-width: $breakpoint_tablet) {
  .draft-grid {
    grid-template-columns: 1fr;
    height: auto;
  }
  .team-card {
    flex: none;
  }
}

</style>