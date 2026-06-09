<template>
  <nav class="nav">
    <div class="club-group">
      <div class="club-name">{{ clubName }}</div>
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

.nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  height: 70px;
  flex-shrink: 0;
  padding: 0 30px;
  background-color: $col_module_background;
  border-bottom: 1px solid $col_module_border;
}

.club-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.club-name {
  font-size: 24px;
  font-weight: 700;
  color: $col_text;
  white-space: nowrap;
}

.restart-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  background-color: $col_text;
  color: $col_module_background;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 18px;
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
  gap: 8px;
}

.nav-link {
  color: $col_text_secondary;
  text-decoration: none;
  font-size: 20px;
  font-weight: 600;
  padding: 8px 16px;
  border-radius: 8px;
  transition: color 0.15s ease, background-color 0.15s ease;
}

.nav-link:hover {
  color: $col_text;
}

.nav-link.router-link-active {
  color: $col_cta;
}

.balance {
  font-size: 22px;
  font-weight: 600;
  color: $col_text;
  white-space: nowrap;
}

</style>
