<template>
  <div class="skills-vis-wrapper">
    <div v-if="goalkeeping !== 0" class="goalkeeper" :style="{ flexGrow: goalkeeping }"/>
    <div v-if="defense !== 0" class="defense" :style="{ flexGrow: defense }"/>
    <div v-if="progression !== 0" class="progression" :style="{ flexGrow: progression }"/>
    <div v-if="shot !== 0" class="shot" :style="{ flexGrow: shot }"/>
  </div>
</template>

<script>

export default {
  name: 'SkillsVisualisation',

  props: {
    skills: Object,
  },

  computed: {
    goalkeeping() { return this.skills.goalkeeping },
    defense() { return this.skills.defense },
    progression() { return this.skills.progression },
    shot() { return this.skills.shot },
  },

}
</script>

<style lang="scss" scoped>
  .skills-vis-wrapper {
    max-width: 100%;
    height: 8px;
    margin: 10px 10px 0;
    border-radius: 4px;
    display: flex;

    div {
      min-height: 100%;
    }

    :first-child {
      border-radius: 4px 0 0 4px;
    }

    :last-child {
      border-radius: 0 4px 4px 0;
    }

    :only-child {
      border-radius: 4px;
    }
  }

  .defense {
    background-color: $col_defense;
  }

  .progression {
    background-color: $col_progression;
  }

  .shot {
    background-color: $col_shot;
  }

  .goalkeeper {
    background-color: $col_goalkeeping;
    border-radius: 8px;
  }

</style>