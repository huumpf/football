<template>
  <div class="player-wrapper">
    <div class="name"><strong>{{ firstName }} {{ lastName }}</strong></div>
    <div class="card_line">
      <div class="position">{{ position }}</div>
      <div class="skill">{{ skill }}</div>
      <div class="age">{{ age }}</div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'TeamListItem',

  props: {
    firstName: String,
    lastName: String,
    positions: Object,
    skill: Number,
    age: Number,
  },

  computed: {
    fullName() { return this.firstName + " " + this.lastName; },
    position() { return this.positions.position },
  },

}
</script>

<style lang="scss" scoped>

.player-wrapper {
  width: 100%;
  padding: 15px 30px;
  display: flex;
  flex-direction: row;
  text-align: left;
  justify-content: space-between;
  background-color: $col_module_background;
  border-bottom: 1px solid $col_module_border;
}

.card_line {
  display:flex;
  flex-direction: row;
  text-align: center;
}

.position, .skill, .age {
  width: 30px;
  margin-left: 10px;
}

</style>