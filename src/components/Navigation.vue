<template>
  <nav class="nav">
    <div class="brand">
      <img class="crest" src="../assets/img/wappen.svg" alt=""/>
      <span class="club-name">{{ clubName }}</span>
      <button class="restart-btn" title="Restart" aria-label="Restart" @click="restartGame">↻</button>
    </div>

    <div class="nav-links">
      <router-link class="nav-link" :to="{ name: 'Team' }">Aufstellung</router-link>
      <router-link class="nav-link" :to="{ name: 'Players' }">Spieler</router-link>
    </div>

    <div class="balance">{{ balance }}</div>
  </nav>
</template>

<script>
export default {
  name: 'Navigation',

  computed: {
    clubName() { return this.$store.state.club.name },
    balance() { return this.$store.state.club.money.toLocaleString('de-DE') + ' €' },
  },

  methods: {
    // TODO: temporary — full reload wipes the in-memory store and starts a fresh draft
    restartGame() {
      window.location.assign('/');
    },
  }
}
</script>

<style lang="scss" scoped>

// Full-width top bar in the card surface colour; the 12px content padding
// below it produces the gutter to the first content card (per the design).
.nav {
  display: flex;
  align-items: center;
  gap: 48px;
  height: 73px;
  flex-shrink: 0;
  padding: 8px 24px;
  background-color: $col_module_background;
}

.brand {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.crest {
  display: block;
  width: 18px;
  height: 20px;
  flex-shrink: 0;
}

.club-name {
  font-family: $font_heading;
  font-size: 20px;
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

// Tabs use the condensed display face; the active tab keeps a white label
// with a soft green glow rather than a colour change.
.nav-link {
  font-family: $font_heading;
  font-size: 16px;
  font-weight: 500;
  color: $col_text;
  opacity: 0.55;
  text-decoration: none;
  transition: opacity 0.15s ease, text-shadow 0.15s ease;
}

.nav-link:hover {
  opacity: 1;
}

.nav-link.router-link-active {
  opacity: 1;
  text-shadow: 0 0 8px $col_cta;
}

.balance {
  flex: 1 0 0;
  min-width: 0;
  text-align: right;
  font-family: $font_body;
  font-size: 12px;
  font-weight: 500;
  color: $col_text;
  white-space: nowrap;
}

</style>
