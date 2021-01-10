<template>
  <div class="player">
    <div class="name">{{ firstName }} {{ lastName }}</div>
    <div class="stats">
      <div class="stats-numbers">
        <div class="number">{{ position }}</div>
        <div class="number">{{ skill }}</div>
        <div class="number">{{ age }}</div>
      </div>
      <div class="stats-refs">
        <div class="reference">Pos</div>
        <div class="reference">Skill</div>
        <div class="reference">Age</div>
      </div>
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
    positions: Object,
    skill: Number,
    skills: Object,
    age: Number,
    salary: Number,
  },

  computed: {
    fullName() { return this.firstName + " " + this.lastName; },
    position() { return this.positions.position; },
    salaryStr() { return HLP.moneyStr(this.salary); },
  },

}
</script>

<style lang="scss" scoped>

.position-wrapper {
  width: 100%;
}

.player {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  margin: 10px 0;
  padding: 20px 30px;
  background-color: $col_module_background;
  border-radius: 8px;
  transition: scale 0.1s ease-out, box-shadow 0.4s;
  box-shadow: 0 20px 40px rgba(0,0,0,0.05);
  font-size: 30px;
  line-height: 34px;

  .name {
    flex-grow: 3;
    width: 50%;
    text-align: left;
  }

  .stats {
    flex-grow: 3;
    display: flex;
    flex-direction: column;

    .stats-numbers, .stats-refs {
      display: flex;
      text-align: center;
      justify-content: space-around;

      .number, .reference {
        margin: 0 10px;
      }
    }

    .stats-refs {
      font-size: 16px;
      line-height: 18px;
      margin-top: 5px;
      color: rgba(255,255,255,.5);
    }
  }

  .salary {
    flex-grow: 1;
    text-align: right;
    min-width: 90px;
  }
}

.player:hover {
  scale: 1.01;
  transition: scale 0.1s ease-out, box-shadow 0.4s;
  cursor: pointer;
  box-shadow: 0 20px 60px rgba(0,0,0,0.08);
}

</style>