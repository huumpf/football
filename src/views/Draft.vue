<template>
  <div class="draft-wrapper">
    <DraftPicks class="flex-big"/>
    <DraftList class="flex-small"/>
  </div>
</template>

<script>
import DraftPicks from '@/components/DraftPicks.vue'
import DraftList from '@/components/DraftList.vue'

export default {
  name: 'Home',

  components: {
    DraftPicks,
    DraftList,
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