<template>
  <div class="player">
    <div class="image"><img src="../assets/img/player.svg" /></div>
    <div class="name"><h3>{{ firstName }} {{ lastName }}</h3></div>
    <div class="card_line">
      <div class="position"><h2>CB</h2>Pos</div>
      <div class="skill"><h2>{{ skill }}</h2>Skill</div>
      <div class="age"><h2>{{ age }}</h2>Age</div>
    </div>
    <div class="salary">{{ salaryStr }} €</div>
  </div>
</template>

<script>

const HLP = require('../assets/js/Helpers.js');

export default {
  name: 'PlayerCard',

  props: {
    firstName: String,
    lastName: String,
    skill: Number,
    age: Number,
    salary: Number,
  },

  computed: {
    fullName() {
      return this.firstName + " " + this.lastName;
    },
    salaryStr() {
      return HLP.moneyStr(this.salary);
    }
  },

}
</script>

<style scoped>

.player {
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

.player:hover {
  scale: 1.05;
  transition: scale 0.1s ease-out, box-shadow 0.4s;
  cursor: pointer;
  box-shadow: 0 20px 60px rgba(0,0,0,0.15);
}

.image {
  height: 140px;
  width:100%;
  background-color: #f0f0f0;
  border-radius: 8px 8px 0 0;
}

.image > img {
  height:140px;
}

.card_line {
  display:flex;
  flex-direction: row;
  justify-content: space-evenly;
  border-bottom: 1px solid #f0f0f0;
  border-top: 1px solid #f0f0f0;
  padding: 20px 0;
}

.name, .salary {
  padding: 20px;
  flex-grow: 1;
}

</style>