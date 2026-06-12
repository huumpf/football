<template>
  <div class="table-wrapper">
    <div class="card list-card">
      <ListRow header>
        <div class="rank">#</div>
        <div class="name">Club</div>
        <div class="metric">Matches</div>
        <div class="metric">Goals</div>
        <div class="metric">Points</div>
        <div class="metric">Skill</div>
      </ListRow>

      <ListRow
        v-for="(entry, index) in standings"
        :key="entry.name"
        class="item"
        :class="{ own: entry.own }"
        @click="openClub(entry)"
      >
        <div class="rank">{{ index + 1 }}</div>
        <div class="name">{{ entry.name }}</div>
        <div class="metric">0</div>
        <div class="metric">0:0</div>
        <div class="metric">0</div>
        <div class="metric">{{ entry.skill }}</div>
      </ListRow>
    </div>
  </div>
</template>

<script>
import ListRow from '../components/ListRow.vue';

export default {
  name: 'Table',

  components: {
    ListRow,
  },

  computed: {
    // All 18 teams: the player's club plus the AI clubs. No matches are played
    // yet, so the standings are ordered by team strength for now.
    standings() {
      const entries = this.$store.state.league.clubs.map(club => ({
        id: club.id,
        name: club.name,
        skill: club.formation.skillSum,
        own: false,
      }));

      entries.push({
        id: null,
        name: this.$store.state.club.name,
        skill: this.$store.getters.recommendedFormation.skillSum,
        own: true,
      });

      return entries.sort((a, b) => b.skill - a.skill);
    },
  },

  methods: {
    openClub(entry) {
      if (entry.own) {
        this.$router.push({ name: 'Team' });
      } else {
        this.$router.push({ name: 'ClubLineup', params: { id: entry.id } });
      }
    },
  },
}
</script>

<style lang="scss" scoped>

// Centered card like the Players page; row height and spacing come from the
// shared ListRow component.
.table-wrapper {
  padding: 12px;
}

// Sized to the columns (rank, club, matches, goals, points, skill).
.list-card {
  max-width: 560px;
  margin: 0 auto;
  overflow: hidden;
  font-weight: 500;
}

.item {
  cursor: pointer;
  transition: color 0.15s ease;
}

.item:hover .name {
  color: $col_cta;
}

// The player's own club is marked by the highlight colour, like the active nav tab.
.own .name {
  color: $col_highlight;
}

.rank {
  width: 36px;
  flex-shrink: 0;
  text-align: center;
}

.name {
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric {
  width: 64px;
  flex-shrink: 0;
  text-align: center;
}

</style>
