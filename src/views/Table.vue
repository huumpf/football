<template>
  <div class="table-wrapper">
    <div class="card list-card">
      <div class="row header">
        <div class="rank">#</div>
        <div class="name">Club</div>
        <div class="metric">Matches</div>
        <div class="metric">Goals</div>
        <div class="metric">Points</div>
        <div class="metric">Skill</div>
      </div>

      <div
        v-for="(entry, index) in standings"
        :key="entry.name"
        class="row item"
        :class="{ own: entry.own }"
        @click="openClub(entry)"
      >
        <div class="rank">{{ index + 1 }}</div>
        <div class="name">{{ entry.name }}</div>
        <div class="metric">0</div>
        <div class="metric">0:0</div>
        <div class="metric">0</div>
        <div class="metric">{{ entry.skill }}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Table',

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

// Full-width card like the Players page; rows mirror the PlayerList styling.
.table-wrapper {
  padding: 12px;
}

.list-card {
  overflow: hidden;
}

.row {
  display: flex;
  align-items: center;
  width: 100%;
  padding: 6px 12px;
  font-size: 16px;
  text-align: left;
}

.item:nth-of-type(even) {
  background-color: $col_page_background;
}

.item {
  cursor: pointer;
  transition: color 0.15s ease;
}

.item:hover .name {
  color: $col_cta;
}

.header {
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  color: $col_text_secondary;
}

// The player's own club glows like the active nav tab.
.own .name {
  color: $col_highlight;
  text-shadow: 0 0 8px $col_cta;
}

.rank {
  width: 36px;
  flex-shrink: 0;
  text-align: center;
  font-weight: 500;
}

.name {
  flex: 1 1 auto;
  min-width: 0;
  margin: 0 12px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.metric {
  width: 64px;
  flex-shrink: 0;
  text-align: center;
  font-weight: 500;
}

</style>
