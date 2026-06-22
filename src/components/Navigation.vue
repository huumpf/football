<template>
  <nav class="nav">
    <div class="nav-left">
      <div class="brand">
        <img class="crest" src="../assets/img/crest.svg" alt=""/>
        <div class="club-info">
          <span class="club-name">{{ clubName }}</span>
          <span class="balance">{{ balance }}</span>
        </div>
        <button class="restart-btn" title="Restart" aria-label="Restart" @click="restartGame">↻</button>
      </div>

      <div class="nav-links">
        <router-link class="nav-link" :to="{ name: 'Team' }">Team</router-link>
        <router-link class="nav-link" :to="{ name: 'Players' }">Players</router-link>
        <router-link class="nav-link" :to="{ name: 'Transfers' }">Transfers</router-link>
        <router-link class="nav-link" :to="{ name: 'League' }">League</router-link>
      </div>
    </div>

    <div class="nav-right">
      <span class="week">Week {{ week }}</span>
      <button class="next-week-btn" @click="advanceWeek">{{ advanceLabel }}</button>
    </div>
  </nav>
</template>

<script>
import { moneyStr } from '../assets/js/Helpers.js';

export default {
  name: 'Navigation',

  emits: ['advance-week'],

  computed: {
    clubName() { return this.$store.state.club.name },
    balance() { return moneyStr(this.$store.state.club.money) + ' €' },
    week() { return this.$store.state.club.week },
    // A week the manager watches their own match advances into the match screen
    // rather than straight to the next week, so the CTA names that.
    advanceLabel() { return this.$store.getters.currentMatch ? 'Next Match' : 'Next Week' },
  },

  methods: {
    // TODO: temporary — full reload wipes the in-memory store and starts a fresh draft
    restartGame() {
      window.location.assign('/');
    },

    // App orchestrates the week transition and commits the store change at the
    // overlay's midpoint, so the new week is revealed rather than popping in.
    advanceWeek() {
      this.$emit('advance-week');
    },
  }
}
</script>

<style lang="scss" scoped>

// Floating top bar in the card surface colour, inset from the page edges
// like the cards below. The left content keeps a 24px gutter; the Next Week
// CTA bleeds flush to the bar's rounded right edge.
.nav {
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  height: 73px;
  flex-shrink: 0;
  margin: 12px 12px 0;
  border-radius: 12px;
  border-bottom: 1px solid $col_page_background;
  overflow: hidden;
  background-color: $col_module_background;
}

.nav-left {
  display: flex;
  align-items: center;
  // Collapses on narrow viewports so the tabs don't run under the week label.
  gap: clamp(16px, 4vw, 64px);
  flex: 1 1 auto;
  min-width: 0;
  padding-left: 24px;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}

.crest {
  display: block;
  width: auto;
  height: 36px;
  flex-shrink: 0;
}

// Club name with the current balance stacked beneath it; the name truncates
// when the brand has to give up space on narrow viewports.
.club-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  align-items: flex-start;
  min-width: 0;
}

.club-name {
  max-width: 100%;
  font-family: $font_heading;
  font-size: 20px;
  font-weight: 500;
  line-height: 24px;
  color: $col_text;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.balance {
  font-family: $font_body;
  font-size: 12px;
  font-weight: 500;
  color: $col_text;
  white-space: nowrap;
}

.restart-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  background-color: $col_text;
  color: $col_module_background;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
  transition: transform 0.1s ease-out, opacity 0.15s ease;
}

.restart-btn:hover {
  transform: scale(1.05);
  opacity: 0.9;
}

.nav-links {
  display: flex;
  gap: 12px;
  flex-shrink: 0;
}

// Tabs use the body face; inactive tabs are dimmed, the active tab is full white.
.nav-link {
  font-family: $font_body;
  font-size: 14px;
  font-weight: 500;
  color: $col_text;
  opacity: 0.5;
  text-decoration: none;
  transition: opacity 0.15s ease;
}

.nav-link:hover {
  opacity: 1;
}

.nav-link.router-link-active {
  opacity: 1;
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-shrink: 0;
  padding-left: 24px;
}

.week {
  font-family: $font_body;
  font-size: 14px;
  font-weight: 500;
  color: $col_text;
  opacity: 0.5;
  white-space: nowrap;
}

// CTA bleeds to the full navbar height with a 30px diagonal cut on the top-left.
.next-week-btn {
  align-self: stretch;
  height: 100%;
  // Extra left padding visually compensates for the diagonal clip cut.
  padding: 0 32px 0 40px;
  border: none;
  background-color: $col_cta;
  color: $col_text;
  font-family: $font_body;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
  cursor: pointer;
  clip-path: polygon(30px 0, 100% 0, 100% 100%, 0 100%);
  transition: filter 0.15s ease;
}

.next-week-btn:hover {
  filter: brightness(1.08);
}

</style>
