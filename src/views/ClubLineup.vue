<template>
  <div v-if="club" class="team-grid">
    <div class="card field-card">
      <div class="club-header">
        <ClubCrest :crest="club.crest" :id="'club-' + club.id" :size="52"/>
        <h2 class="club-name">{{ club.name }}</h2>
        <div class="formation-name">{{ club.formation.name }} · {{ Math.round(club.formation.skillSum) }}</div>
      </div>

      <div class="field-wrapper">
        <Lineup :formation="club.formation"/>
      </div>
    </div>

    <div class="card team-card">
      <PlayerList title="Squad" :players="club.players"/>
    </div>
  </div>
</template>

<script>
import Lineup from '@/components/Lineup.vue';
import PlayerList from '@/components/PlayerList.vue';
import ClubCrest from '@/components/ClubCrest.vue';

export default {
  name: 'ClubLineup',

  created() {
    // Direct URL hits without a generated league (e.g. after a reload) have
    // nothing to show — back to the table.
    if (!this.club) this.$router.replace({ name: 'League' });
  },

  computed: {
    club() {
      const id = Number(this.$route.params.id);
      return this.$store.state.league.clubs.find(club => club.id === id) || null;
    },
  },

  components: {
    Lineup,
    PlayerList,
    ClubCrest,
  },
}
</script>

<style lang="scss" scoped>

// Same responsive card grid as the player's own Team view, minus the
// formation select: the AI club's lineup is read-only.
.team-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) clamp(300px, 26%, 380px);
  gap: 12px;
  padding: 12px;
  height: 100%;
}

.field-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}

.club-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.club-header .club-crest {
  margin-bottom: 8px;
}

.club-name {
  font-size: 20px;
  font-weight: 500;
}

.formation-name {
  font-size: 14px;
  font-weight: 500;
  color: $col_text_secondary;
}

.field-wrapper {
  width: 100%;
  margin-top: 12px;
}

.team-card {
  min-height: 0;
  overflow: auto;
}

@media screen and (max-width: $breakpoint_tablet) {
  .team-grid {
    grid-template-columns: 1fr;
    height: auto;
  }
}

</style>
