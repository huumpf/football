<template>
  <div class="draft-wrapper">
    <DraftPicks class="flex-big"/>
    <div class="my-team-wrapper flex-small">
      <PositionVisualisation :positions="positions"/>
      <TeamList class="flex-grow"/>
    </div>
  </div>
</template>

<script>
import DraftPicks from '@/components/DraftPicks.vue'
import PositionVisualisation from '@/components/PositionVisualisation.vue'
import TeamList from '@/components/TeamList.vue'

export default {
  name: 'Home',

  components: {
    DraftPicks,
    PositionVisualisation,
    TeamList,
  },

  computed: {
    positions() { return this.$store.state.team.positionCount },
  },
}
</script>

<style lang="scss" scoped>

.draft-wrapper {
  display: flex;
  height: 100vh;
}
@media screen and (max-width: $breakpoint_tablet) {
  .draft-wrapper {
    display: flex;
    flex-direction: column;
  }
}


  .flex-big {
    flex-grow: 1;
  }
  @media screen and (max-width: $breakpoint_tablet) {
  .flex-big {
    width: 100%;
  }}

  .flex-small {
    width: 400px;
    // flex-grow: 1;
  }
  @media screen and (max-width: $breakpoint_tablet) {
  .flex-small {
    width: 100%;
  }}

  .my-team-wrapper {
    display: flex;
    flex-direction: column;
  }

  .flex-grow {
    flex-grow: 1;
  }

</style>