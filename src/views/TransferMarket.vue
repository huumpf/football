<template>
  <div class="market-wrapper">
    <div class="card list-card">
      <PlayerList
        v-if="rows.length > 0"
        :players="rows"
        show-value
        show-club
      >
        <template #actions="{ player }">
          <button
            v-if="player.own"
            type="button"
            class="market-btn remove"
            @click="unlist(player)"
          >Remove</button>
          <button
            v-else
            type="button"
            class="market-btn buy"
            :disabled="money < player.price"
            @click="buy(player)"
          >Buy</button>
        </template>
      </PlayerList>
      <p v-else class="empty">No players on the market.</p>
    </div>
  </div>
</template>

<script>
import PlayerList from '../components/PlayerList.vue';

export default {
  name: 'TransferMarket',

  components: {
    PlayerList,
  },

  computed: {
    listings() { return this.$store.getters.marketListings },
    money() { return this.$store.state.club.money },

    // PlayerList rows: the listed player plus the listing's display fields.
    rows() {
      return this.listings.map(listing => ({
        ...listing.player,
        clubName: listing.clubName,
        price: listing.price,
        own: listing.own,
      }));
    },
  },

  methods: {
    listingFor(row) {
      return this.listings.find(listing => listing.playerId === row.id);
    },

    buy(row) {
      this.$store.dispatch('buyPlayer', this.listingFor(row));
    },

    unlist(row) {
      this.$store.dispatch('unlistPlayer', row);
    },
  },
}
</script>

<style lang="scss" scoped>

.market-wrapper {
  padding: 12px;
}

// Sized to the columns (position, name, skill, age, value, club, action).
.list-card {
  max-width: 720px;
  margin: 0 auto;
  overflow: hidden;
}

.empty {
  padding: 24px 12px;
  text-align: center;
  font-size: 14px;
  color: $col_text_secondary;
}

.market-btn {
  padding: 3px 10px;
  border: none;
  border-radius: 6px;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s ease;
}

.market-btn:hover:not(:disabled) {
  opacity: 0.85;
}

.market-btn.buy {
  background-color: $col_cta;
  color: $col_text;
}

.market-btn.buy:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.market-btn.remove {
  background-color: transparent;
  border: 1px solid $col_module_border;
  color: $col_text_secondary;
}

</style>
