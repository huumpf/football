<template>
  <div class="draft-wrapper">
    <DraftPicks class="flex-big"/>
    <div class="my-team-wrapper flex-small">
      <PositionVisualisation :positions="skillsPerPosition" :positionCount="countPerPosition"/>
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
    skillsPerPosition() { return this.$store.state.team.positionStats },
    countPerPosition() { return this.$store.state.team.positionCount },
    skills() { return this.$store.state.team.skillCount },
    draftIsCompleted() { return this.$store.state.team.players.length === this.$store.state.draft.draftAmount }
  },

  watch: {
    draftIsCompleted: function () {
      this.$router.push({ name: "Team" });
    }
  }
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
    height: auto;
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
  background-color: $col_page_background_secondary;
}

.flex-grow {
  flex-grow: 1;
}

</style>