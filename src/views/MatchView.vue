<template>
  <div v-if="match" class="match-view">
    <!-- Matchday top bar: just the two teams, no navigation. -->
    <div class="match-bar">
      <span class="bar-team">{{ match.home.name }}</span>
      <span class="bar-team">{{ match.away.name }}</span>
    </div>

    <div class="match-body">
      <MatchLineupList
        side="home"
        :starters="homeStarters"
        :bench="homeBench"
      />

      <div class="center">
        <div class="score-card">
          <span class="team home-name">{{ match.home.name }}</span>
          <div class="score">
            <span class="num">{{ homeGoals }}</span>
            <span class="dash">–</span>
            <span class="num">{{ awayGoals }}</span>
          </div>
          <span class="team away-name">{{ match.away.name }}</span>
        </div>

        <div class="action">
          <button v-if="phase === 'pre'" class="cta" @click="start">Start match</button>
          <div v-else class="progress">
            <div class="track"><div class="fill" :style="{ width: progressPct + '%' }"></div></div>
            <span class="minute">{{ minute }}’</span>
          </div>
          <button v-if="phase === 'done'" class="cta continue" @click="continueMatch">Continue</button>
        </div>

        <transition-group name="event" tag="div" class="timeline">
          <div
            v-for="ev in revealedReversed"
            :key="`${ev.side}-${ev.minute}-${ev.scorer.id}`"
            class="event-row"
            :class="ev.side"
          >
            <div class="event">
              <template v-if="ev.side === 'home'">
                <span class="ev-minute">{{ ev.minute }}’</span>
                <span class="ev-text">{{ scorerText(ev) }}</span>
                <img class="ev-ball" src="../assets/img/icons/goal-white.svg" alt=""/>
              </template>
              <template v-else>
                <img class="ev-ball" src="../assets/img/icons/goal-white.svg" alt=""/>
                <span class="ev-text">{{ scorerText(ev) }}</span>
                <span class="ev-minute">{{ ev.minute }}’</span>
              </template>
            </div>
          </div>
        </transition-group>
      </div>

      <MatchLineupList
        side="away"
        :starters="awayStarters"
        :bench="awayBench"
      />
    </div>
  </div>
</template>

<script>
import MatchLineupList from '@/components/MatchLineupList.vue';
import { simulateLiveMatch } from '@/assets/js/MatchSim.js';
import * as CFG from '@/assets/js/Config.js';

export default {
  name: 'MatchView',

  components: { MatchLineupList },

  data() {
    return {
      // Snapshot of the matchup, taken on entry so the screen keeps rendering
      // even after finishMatch clears the currentMatch getter on the way out.
      match: null,
      // Full pre-rolled timeline { totalMinutes, homeGoals, awayGoals, events }.
      timeline: null,
      minute: 0,
      // 'pre' (kick-off pending) -> 'playing' -> 'done' (full time).
      phase: 'pre',
      timer: null,
    };
  },

  computed: {
    // Events whose minute has been reached by the running clock.
    revealedEvents() {
      if (!this.timeline) return [];
      return this.timeline.events.filter(e => e.minute <= this.minute);
    },

    revealedReversed() {
      return [...this.revealedEvents].reverse();
    },

    homeGoals() {
      return this.revealedEvents.filter(e => e.side === 'home').length;
    },

    awayGoals() {
      return this.revealedEvents.filter(e => e.side === 'away').length;
    },

    // Player id -> live 0..10 rating. Every starter sits at the base; goals and
    // assists from revealed events lift the scorer and assister.
    ratingByPlayer() {
      const tally = {};
      for (const e of [...this.match.home.xi, ...this.match.away.xi]) {
        tally[e.player.id] = { goals: 0, assists: 0 };
      }
      for (const ev of this.revealedEvents) {
        if (tally[ev.scorer.id]) tally[ev.scorer.id].goals += 1;
        if (ev.assist && tally[ev.assist.id]) tally[ev.assist.id].assists += 1;
      }
      const ratings = {};
      for (const id in tally) {
        const raw = CFG.MATCH_RATING_BASE
          + CFG.MATCH_RATING_GOAL * tally[id].goals
          + CFG.MATCH_RATING_ASSIST * tally[id].assists;
        ratings[id] = Math.min(10, Math.max(1, raw));
      }
      return ratings;
    },

    scoredIds() {
      const ids = new Set();
      for (const ev of this.revealedEvents) ids.add(ev.scorer.id);
      return ids;
    },

    assistedIds() {
      const ids = new Set();
      for (const ev of this.revealedEvents) if (ev.assist) ids.add(ev.assist.id);
      return ids;
    },

    homeStarters() {
      return this.starterRows(this.match.home.xi);
    },

    awayStarters() {
      return this.starterRows(this.match.away.xi);
    },

    homeBench() {
      return this.match.home.bench;
    },

    awayBench() {
      return this.match.away.bench;
    },

    progressPct() {
      if (!this.timeline) return 0;
      return (this.minute / this.timeline.totalMinutes) * 100;
    },
  },

  created() {
    const match = this.$store.getters.currentMatch;
    if (!match) {
      this.$router.replace({ name: 'League' });
      return;
    }
    this.match = match;
  },

  beforeUnmount() {
    if (this.timer) clearInterval(this.timer);
  },

  methods: {
    starterRows(xi) {
      return xi.map(e => ({
        player: e.player,
        position: e.position,
        rating: this.ratingByPlayer[e.player.id],
        scored: this.scoredIds.has(e.player.id),
        assisted: this.assistedIds.has(e.player.id),
      }));
    },

    scorerText(ev) {
      const base = `${ev.scorer.lastName} scored`;
      return ev.assist ? `${base} (assist by ${ev.assist.lastName})` : base;
    },

    // Roll the whole match up front, then reveal it minute by minute. Strength
    // and the scoring XI come from each side's strongest formation.
    start() {
      const toSide = side => ({
        name: side.name,
        xi: side.xi.map(e => e.player),
        strength: side.strength,
      });
      this.timeline = simulateLiveMatch(toSide(this.match.home), toSide(this.match.away));
      this.phase = 'playing';
      this.minute = 0;
      this.timer = setInterval(() => {
        this.minute += 1;
        if (this.minute >= this.timeline.totalMinutes) {
          this.minute = this.timeline.totalMinutes;
          clearInterval(this.timer);
          this.timer = null;
          this.phase = 'done';
        }
      }, CFG.MATCH_TICK_MS);
    },

    // Record the watched result into the matchday (the other 8 instant-played)
    // and advance the week, then head to the league table to see it land.
    continueMatch() {
      this.$store.dispatch('finishMatch', {
        homeGoals: this.timeline.homeGoals,
        awayGoals: this.timeline.awayGoals,
      });
      this.$router.push({ name: 'League' });
    },
  },
}
</script>

<style lang="scss" scoped>
.match-view {
  min-height: 100%;
  padding: 12px;
}

// Same surface as the navbar, but it only carries the two team names.
.match-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 73px;
  padding: 0 24px;
  border-radius: 12px;
  border-bottom: 1px solid $col_page_background;
  background-color: $col_module_background;
}

.bar-team {
  font-family: $font_heading;
  font-size: 20px;
  font-weight: 500;
  color: $col_text;
}

.match-body {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  gap: 12px;
  max-width: 1416px;
  margin: 0 auto;
  padding-top: 12px;
}

.center {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  max-width: 847px;
}

.score-card {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 24px;
  width: 100%;
  padding: 24px 48px;
  border-radius: 12px;
  background-color: $col_module_background;
}

.team {
  flex-shrink: 0;
  width: 200px;
  font-family: $font_heading;
  font-size: 20px;
  font-weight: 500;
  color: $col_text;
}

.home-name { text-align: right; }
.away-name { text-align: left; }

.score {
  display: flex;
  align-items: center;
  gap: 24px;
  font-family: $font_heading;
  font-weight: 500;
  line-height: 1;
  color: $col_text;
}

.num {
  font-size: clamp(56px, 9vw, 120px);
}

.dash {
  font-size: 40px;
  opacity: 0.6;
}

.action {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  width: 100%;
  margin-top: 20px;
}

// Green call-to-action matching the navbar's Next Week button.
.cta {
  padding: 14px 40px;
  border: none;
  border-radius: 8px;
  background-color: $col_cta;
  color: $col_text;
  font-family: $font_body;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: filter 0.15s ease;
}

.cta:hover {
  filter: brightness(1.08);
}

.progress {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
}

.track {
  flex: 1 1 auto;
  height: 6px;
  border-radius: 999px;
  background: rgba($col_text, 0.2);
  overflow: hidden;
}

.fill {
  height: 100%;
  border-radius: 999px;
  background: $col_cta;
  transition: width 0.15s linear;
}

.minute {
  flex-shrink: 0;
  font-family: $font_heading;
  font-size: 24px;
  font-weight: 500;
  color: $col_text;
}

// Vertical feed of goals, latest on top, split across a centre line: home goals
// to the left, away goals to the right.
.timeline {
  position: relative;
  // Keep the centre line behind the cards within its own stacking context.
  isolation: isolate;
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 100%;
  margin-top: 32px;
}

.timeline::before {
  content: '';
  position: absolute;
  z-index: -1;
  top: 0;
  bottom: 0;
  left: 50%;
  width: 1px;
  background: rgba($col_text, 0.15);
}

.event-row {
  display: flex;
}

// The marker hugs the card's inner edge (12px padding + 8px half-icon), so
// pulling the card back by 20px from the centre lands the icon's centre on the
// line for both sides.
.event-row.home {
  justify-content: flex-end;
  padding-right: calc(50% - 20px);
}

.event-row.away {
  justify-content: flex-start;
  padding-left: calc(50% - 20px);
}

// Reveal each new event with a soft fade-and-drop; existing rows ease down to
// make room.
.event-enter-active {
  transition: opacity 0.3s ease-out, transform 0.3s ease-out;
}

.event-enter-from {
  opacity: 0;
  transform: translateY(-8px);
}

.event-move {
  transition: transform 0.3s ease-out;
}

.event {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 8px;
  background-color: $col_module_background;
  font-size: 13px;
  font-weight: 500;
  color: $col_text;
}

.ev-minute {
  flex-shrink: 0;
  opacity: 0.5;
}

.ev-ball {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}
</style>
