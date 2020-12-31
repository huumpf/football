<template>
  <div class="draft-wrapper">
    <DraftPicks class="flex-big"/>
    <div class="my-team-wrapper flex-small">
      <TeamVisualisation :positions="positions" @click="logPositions()"/>
      <TeamList class="flex-grow"/>
    </div>
  </div>
</template>

<script>
import DraftPicks from '@/components/DraftPicks.vue'
import TeamVisualisation from '@/components/TeamVisualisation.vue'
import TeamList from '@/components/TeamList.vue'

export default {
  name: 'Home',

  components: {
    DraftPicks,
    TeamVisualisation,
    TeamList,
  },

  computed: {
    positions() { return this.$store.state.team.positionCount },
  },

  methods: {
    logPositions() {
      console.log(this.positions);
    }
  }
}
</script>

<style lang="scss" scoped>
  .draft-wrapper {
    display: flex;
  }

  .flex-big {
    width: 73%;
  }

  .flex-small {
    flex-grow: 1;
  }

  .my-team-wrapper {
    height:100vh;
    display: flex;
    flex-direction: column;
  }

  .flex-grow {
    flex-grow: 1;
  }

</style>