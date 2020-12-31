<template>
  <div class="player-wrapper">
    <div class="name"><h3>{{ firstName }} {{ lastName }}</h3></div>
    <div class="card_line">
      <div class="position"><h2>CB</h2>Pos</div>
      <div class="skill"><h2>{{ skill }}</h2>Skill</div>
      <div class="age"><h2>{{ age }}</h2>Age</div>
    </div>
  </div>
</template>

<script>

export default {
  name: 'PlayerListItem',

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

<style scoped>

.player-wrapper {
  display: flex;
  flex-direction: column;
  text-align: center;
  width: 280px;
  background-color: #fff;
  margin: 20px;
  border-radius: 8px;
  transition: scale 0.1s ease-out, box-shadow 0.4s;
  box-shadow: 0 20px 40px rgba(0,0,0,0.1);
}

.card_line {
  display:flex;
  flex-direction: row;
  justify-content: space-evenly;
  border-bottom: 1px solid #f0f0f0;
  border-top: 1px solid #f0f0f0;
  padding: 20px 0;
}

.name {
  padding: 20px;
}

</style>