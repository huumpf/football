<template>
  <div class="player-wrapper">
    <div class="name"><strong>Name</strong></div>
    <div class="card_line">
      <div class="position">Pos</div>
      <div class="skill">Skl</div>
      <div class="age">Age</div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'TeamListHeader',

  props: {
    firstName: String,
    lastName: String,
    skill: Number,
    age: Number,
  },

  computed: {
    fullName() { return this.firstName + " " + this.lastName; },
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
  color: $col_text_secondary;
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