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

export default {
  name: 'Home',

  components: {
    DraftPicks,
    SquadPreview,
    TeamList,
  },

  created() {
    this.$store.dispatch('makeLeague');
  },

  computed: {
    draftIsCompleted() { return this.$store.state.team.players.length === this.$store.state.draft.draftAmount }
  },

  watch: {
    draftIsCompleted: function () {
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