<template>
  <div class="draft-picks-wrapper">
    <h1>Pick a player</h1>
    <p>{{ currentMoney }}</p>
    <button @click="pay(10000)">pay</button>
    <p v-for="(player, index) in players" :key="index">{{ player }}</p>
  </div>
</template>

<script>
export default {
  name: 'DraftPicks',
  
  computed: {
    players() { return this.$store.state.team.players },
    currentMoney() { return this.$store.state.club.money },
  },

  methods: {
    pay(amount) {
      this.$store.dispatch('pay', amount);
    }
  }
}
</script>

<style lang="scss" scoped>

  .draft-picks-wrapper {
    background-color: $col_cta;
    height: 100vh;
  }

</style>