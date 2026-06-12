<template>
  <div class="matchday" v-if="fixtures.length">
    <div class="pager">
      <button
        class="arrow"
        aria-label="Previous matchday"
        :disabled="matchday === 0"
        @click="matchday--"
      >
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M27 16H5M13 8l-8 8 8 8"/>
        </svg>
      </button>
      <h2 class="title">Match {{ matchday + 1 }}</h2>
      <button
        class="arrow"
        aria-label="Next matchday"
        :disabled="matchday === fixtures.length - 1"
        @click="matchday++"
      >
        <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M5 16h22M19 8l8 8-8 8"/>
        </svg>
      </button>
    </div>

    <div class="pairings">
      <div class="pairing" v-for="(match, index) in pairings" :key="index">
        <div class="team" :class="{ own: match.home.own }">
          <span class="rank">{{ match.home.rank }}.</span>
          <span class="name">{{ match.home.name }}</span>
          <span class="skill">{{ match.home.skill }}</span>
        </div>
        <span class="score" v-if="match.result">{{ match.result.homeGoals }}:{{ match.result.awayGoals }}</span>
        <span class="score dash" v-else></span>
        <div class="team" :class="{ own: match.away.own }">
          <span class="rank">{{ match.away.rank }}.</span>
          <span class="name">{{ match.away.name }}</span>
          <span class="skill">{{ match.away.skill }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as CFG from '../assets/js/Config.js';
import * as SCHED from '../assets/js/Schedule.js';

export default {
  name: 'Matchday',

  data() {
    return {
      // Start on the current week's matchday; in match-free weeks fall back
      // to the next upcoming one (or the season's last after the final round).
      matchday: initialMatchday(this.$store.state.club.week),
    };
  },

  computed: {
    fixtures() { return this.$store.state.league.fixtures },

    // Standings position, name and skill per club id, for both fixture sides.
    clubsById() {
      const byId = new Map();
      this.$store.getters.standings.forEach((entry, index) => {
        byId.set(entry.id, { ...entry, rank: index + 1 });
      });
      return byId;
    },

    // The shown matchday's 9 matches with both clubs resolved; result is the
    // played score or undefined while the matchday is still upcoming.
    pairings() {
      const results = this.$store.state.league.results[this.matchday];
      return this.fixtures[this.matchday].map((match, index) => ({
        home: this.clubsById.get(match.home),
        away: this.clubsById.get(match.away),
        result: results && results[index],
      }));
    },
  },
}

function initialMatchday(week) {
  const matchday = SCHED.matchdayForWeek(week);
  if (matchday !== null) return matchday;
  if (week < CFG.FIRST_HALF_START_WEEK) return 0;
  if (week < CFG.SECOND_HALF_START_WEEK) return CFG.MATCHDAYS_PER_HALF;
  return 2 * CFG.MATCHDAYS_PER_HALF - 1;
}
</script>

<style lang="scss" scoped>

// The module floats on the page background; only the team chips get a surface.
.matchday {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 32px;
  width: 100%;
  max-width: 604px;
}

.pager {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
}

.title {
  font-family: $font_heading;
  font-size: 50px;
  font-weight: 500;
  line-height: 1;
  color: $col_text;
  // Keep "Match 1" and "Match 34" from nudging the arrows around.
  min-width: 130px;
}

// Dimmed by default, full strength on hover; disabled arrows disappear but
// keep their space so the title doesn't shift.
.arrow {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  padding: 12px;
  border: none;
  border-radius: 999px;
  background: none;
  color: $col_text;
  opacity: 0.5;
  cursor: pointer;
  transition: opacity 0.15s ease, background-color 0.15s ease;
}

.arrow svg {
  width: 32px;
  height: 32px;
}

.arrow:hover:not(:disabled) {
  opacity: 1;
  background-color: $col_190_t10;
}

.arrow:disabled {
  visibility: hidden;
}

.pairings {
  display: flex;
  flex-direction: column;
  gap: 4px;
  width: 100%;
}

.pairing {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.team {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 0;
  min-width: 0;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: $col_module_background;
  font-size: 12px;
  font-weight: 500;
}

// The player's own club is marked by the highlight colour, like in the table.
.own .name {
  color: $col_highlight;
}

// Fixed-width and right-aligned so club names line up across all pairings,
// whether the rank is "1." or "18.".
.rank {
  width: 20px;
  flex-shrink: 0;
  text-align: right;
  opacity: 0.5;
}

.name {
  flex: 1 1 auto;
  min-width: 0;
  text-align: left;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.skill {
  width: 25px;
  flex-shrink: 0;
  text-align: center;
}

// Played matches show the score between the chips, upcoming ones a dash.
.score {
  width: 34px;
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 500;
}

.dash::before {
  content: '';
  width: 24px;
  height: 1px;
  background-color: $col_text_faded;
}

</style>
