<template>
  <div class="draft-wrapper">
    <DraftPicks class="flex-big"/>
    <TeamList class="flex-small"/>
  </div>
</template>

<script>
import DraftPicks from '@/components/DraftPicks.vue'
import TeamList from '@/components/TeamList.vue'

export default {
  name: 'Home',

  components: {
    DraftPicks,
    TeamList,
  }
}
</script>

<style lang="scss" scoped>

  .draft-wrapper {
    display: flex;
  }

  .flex-big {
    width: 70%;
  }

  .flex-small {
    flex-grow: 1;
  }

</style>