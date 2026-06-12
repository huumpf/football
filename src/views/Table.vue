<template>
  <div class="table-wrapper">
    <div class="card list-card">
      <div class="list-headline">Standings</div>
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
        <div class="metric">{{ entry.played }}</div>
        <div class="metric">{{ entry.goalsFor }}:{{ entry.goalsAgainst }}</div>
        <div class="metric">{{ entry.points }}</div>
        <div class="metric">{{ entry.skill }}</div>
      </ListRow>
    </div>

    <div class="matchday-col">
      <Matchday/>
    </div>
  </div>
</template>

<script>
import ListRow from '../components/ListRow.vue';
import Matchday from '../components/Matchday.vue';

export default {
  name: 'Table',

  components: {
    ListRow,
    Matchday,
  },

  computed: {
    standings() {
      return this.$store.getters.standings;
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

// Standings card and matchday module centered as a pair, horizontally and
// vertically, with the design's 96px breathing room between them (shrinking
// on narrow viewports). Row spacing comes from the shared ListRow component.
.table-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: clamp(24px, 7vw, 96px);
  padding: 12px;
  min-height: 100%;
}

// Sized to the columns (rank, club, matches, goals, points, skill).
.list-card {
  flex: 0 1 560px;
  min-width: 0;
  overflow: hidden;
  font-weight: 500;
}

.matchday-col {
  flex: 0 1 604px;
  min-width: 0;
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
