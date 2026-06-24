<template>
  <div v-if="match" class="match-view">
    <!-- Matchday top bar: just the two teams, no navigation. -->
    <div class="match-bar">
      <span class="bar-team"><ClubCrest :crest="crestFor(match.home.id)" :id="'mv-bar-h'" :size="24"/>{{ match.home.name }}</span>
      <span class="bar-team"><ClubCrest :crest="crestFor(match.away.id)" :id="'mv-bar-a'" :size="24"/>{{ match.away.name }}</span>
    </div>

    <div class="match-body">
      <MatchLineupList
        side="home"
        :starters="homeStarters"
        :bench="homeBench"
      />

      <div class="center">
        <div class="score-card">
          <span class="team home-name">{{ match.home.name }}<ClubCrest :crest="crestFor(match.home.id)" :id="'mv-sc-h'" :size="30"/></span>
          <div class="score">
            <span class="num">{{ homeGoals }}</span>
            <span class="dash">–</span>
            <span class="num">{{ awayGoals }}</span>
          </div>
          <span class="team away-name"><ClubCrest :crest="crestFor(match.away.id)" :id="'mv-sc-a'" :size="30"/>{{ match.away.name }}</span>
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
            :key="`${ev.type}-${ev.side}-${ev.minute}-${ev.player.id}-${ev.playerIn ? ev.playerIn.id : ''}`"
            class="event-row"
            :class="ev.side"
          >
            <div class="event">
              <template v-if="ev.side === 'home'">
                <span class="ev-minute">{{ ev.minute }}’</span>
                <span class="ev-text">{{ eventText(ev) }}</span>
                <img class="ev-ball" :src="eventIcon(ev)" alt=""/>
              </template>
              <template v-else>
                <img class="ev-ball" :src="eventIcon(ev)" alt=""/>
                <span class="ev-text">{{ eventText(ev) }}</span>
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
import ClubCrest from '@/components/ClubCrest.vue';
import { simulateLiveMatch, computeRatings, injuriesFromTimeline } from '@/assets/js/MatchSim.js';
import * as CFG from '@/assets/js/Config.js';

export default {
  name: 'MatchView',

  components: { MatchLineupList, ClubCrest },

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

    goalEvents() {
      return this.revealedEvents.filter(e => e.type === 'goal');
    },

    homeGoals() {
      return this.goalEvents.filter(e => e.side === 'home').length;
    },

    awayGoals() {
      return this.goalEvents.filter(e => e.side === 'away').length;
    },

    // Player id -> live 0..10 rating, folded from everything up to the current
    // minute (duels, goals, cards, the running scoreline), so ratings move up
    // and down as the match plays out. Empty until the match is rolled.
    ratingByPlayer() {
      if (!this.timeline) return {};
      return computeRatings(this.timeline, this.match.home, this.match.away, this.minute);
    },

    // Player id -> live fitness, draining from each starter's match-start value
    // toward (start - his rolled match drain) as the clock runs — this is in-match
    // fatigue only, and the per-player drain is random (the engine's per-minute
    // total), so they tire by different amounts. The weekly tick (updateFitness)
    // afterwards recovers part of that drain, so the squad screens then show a
    // higher value. Before kick-off this reads the stored match-start fitness.
    fitnessByPlayer() {
      const map = {};
      if (!this.match) return map;
      const frac = this.timeline && this.timeline.totalMinutes
        ? Math.min(1, this.minute / this.timeline.totalMinutes)
        : 0;
      const drainTotals = (this.timeline && this.timeline.drain) || {};
      for (const e of [...this.match.home.xi, ...this.match.away.xi]) {
        const start = e.player.fitness ?? CFG.STAMINA_MAX;
        const drain = (drainTotals[e.player.id] || 0) * frac;
        map[e.player.id] = Math.max(0, start - drain);
      }
      return map;
    },

    scoredIds() {
      const ids = new Set();
      for (const ev of this.goalEvents) ids.add(ev.player.id);
      return ids;
    },

    assistedIds() {
      const ids = new Set();
      for (const ev of this.goalEvents) if (ev.assist) ids.add(ev.assist.id);
      return ids;
    },

    // Player id -> 'yellow' | 'red' from revealed card events (a red supersedes
    // an earlier yellow), used for the per-player marker in the line-up lists.
    cardByPlayer() {
      const cards = {};
      for (const ev of this.revealedEvents) {
        if (ev.type === 'yellow' && cards[ev.player.id] !== 'red') cards[ev.player.id] = 'yellow';
        else if (ev.type === 'red') cards[ev.player.id] = 'red';
      }
      return cards;
    },

    // Ids of players injured / subbed off / subbed on by the running clock, folded
    // from revealed events like cardByPlayer. They drive the per-row markers in
    // the line-up lists (injury icon, sub-out, sub-in) as the match plays out.
    injuredIds() {
      const ids = new Set();
      for (const ev of this.revealedEvents) if (ev.type === 'injury') ids.add(ev.player.id);
      return ids;
    },

    subbedOutIds() {
      const ids = new Set();
      for (const ev of this.revealedEvents) if (ev.type === 'sub') ids.add(ev.player.id);
      return ids;
    },

    subbedInIds() {
      const ids = new Set();
      for (const ev of this.revealedEvents) if (ev.type === 'sub') ids.add(ev.playerIn.id);
      return ids;
    },

    // Player id -> the injury details from the revealed injury event. In-match the
    // injury isn't yet on player.injury (it's committed afterwards), so the side
    // lists feed these to the injury icon's tooltip.
    injuryByPlayer() {
      const map = {};
      for (const ev of this.revealedEvents) if (ev.type === 'injury') map[ev.player.id] = ev.injury;
      return map;
    },

    homeStarters() {
      return this.starterRows(this.match.home.xi);
    },

    awayStarters() {
      return this.starterRows(this.match.away.xi);
    },

    homeBench() {
      return this.benchRows(this.match.home.bench);
    },

    awayBench() {
      return this.benchRows(this.match.away.bench);
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
    crestFor(id) {
      return this.$store.getters.crestById(id);
    },
    starterRows(xi) {
      return xi.map(e => ({
        player: e.player,
        position: e.position,
        rating: this.ratingByPlayer[e.player.id],
        fitness: this.fitnessByPlayer[e.player.id],
        scored: this.scoredIds.has(e.player.id),
        assisted: this.assistedIds.has(e.player.id),
        card: this.cardByPlayer[e.player.id] || null,
        injured: this.injuredIds.has(e.player.id),
        injuryData: this.injuryByPlayer[e.player.id] || null,
        subbedOut: this.subbedOutIds.has(e.player.id),
      }));
    },

    // Bench rows for the side lists: a substitute who has come on shows the
    // sub-in marker and his live rating; otherwise the dash, as before.
    benchRows(bench) {
      return bench.map(e => {
        const subbedOn = this.subbedInIds.has(e.player.id);
        return {
          player: e.player,
          position: e.position,
          subbedOn,
          rating: subbedOn ? this.ratingByPlayer[e.player.id] : null,
          injured: this.injuredIds.has(e.player.id),
          injuryData: this.injuryByPlayer[e.player.id] || null,
        };
      });
    },

    // Icon and one-line text for a timeline event (goal / card / injury / sub).
    eventIcon(ev) {
      if (ev.type === 'yellow') return new URL('../assets/img/icons/yellowCard.svg', import.meta.url).href;
      if (ev.type === 'red') return new URL('../assets/img/icons/redCard.svg', import.meta.url).href;
      if (ev.type === 'injury') return new URL('../assets/img/icons/injury-white.svg', import.meta.url).href;
      if (ev.type === 'sub') return new URL('../assets/img/icons/substitution-white.svg', import.meta.url).href;
      return new URL('../assets/img/icons/goal-white.svg', import.meta.url).href;
    },

    eventText(ev) {
      if (ev.type === 'yellow') return `${ev.player.lastName} booked`;
      if (ev.type === 'red') return `${ev.player.lastName} sent off`;
      // Generic — the specific injury is never revealed in the stream.
      if (ev.type === 'injury') return `${ev.player.lastName} injured`;
      if (ev.type === 'sub') return `${ev.player.lastName} was subbed out for ${ev.playerIn.lastName}`;
      const base = `${ev.player.lastName} scored`;
      return ev.assist ? `${base} (assist by ${ev.assist.lastName})` : base;
    },

    // Roll the whole match up front, then reveal it minute by minute. The duel
    // engine reads each side's { xi: [{player, position}], strength } directly,
    // so the same line-up entries drive the live ratings.
    start() {
      this.timeline = simulateLiveMatch(this.match.home, this.match.away);
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
    // and advance the week, then head to the league table to see it land. The
    // final ratings ride along so the watched players' season log updates too.
    continueMatch() {
      this.$store.dispatch('finishMatch', {
        homeGoals: this.timeline.homeGoals,
        awayGoals: this.timeline.awayGoals,
        ratings: computeRatings(this.timeline, this.match.home, this.match.away),
        injuries: injuriesFromTimeline(this.timeline),
        drain: this.timeline.drain,
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
  display: inline-flex;
  align-items: center;
  gap: 10px;
  font-family: $font_heading;
  font-size: 20px;
  font-weight: 500;
  color: $col_text;
}

// Mirror the away side so its crest sits on the outer edge.
.match-bar .bar-team:last-child {
  flex-direction: row-reverse;
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
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  width: 200px;
  font-family: $font_heading;
  font-size: 20px;
  font-weight: 500;
  color: $col_text;
}

// Crests flank the score: home's on its right, away's on its left.
.home-name { justify-content: flex-end; text-align: right; }
.away-name { justify-content: flex-start; text-align: left; }

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
