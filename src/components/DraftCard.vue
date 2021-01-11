<template>
  <div class="player">
    <div class="name">{{ fullName }}</div>
    <div class="stats">
      <div class="stat-numbers">
        <div class="stat">
          <div class="number">{{ position }}</div>
          <div class="reference">Pos</div>
        </div>
        <div class="stat">
          <div class="number">{{ skill }}</div>
          <div class="reference">Skill</div>
        </div>
        <div class="stat">
          <div class="number">{{ age }}</div>
          <div class="reference">Age</div>
        </div>
      </div>
      <div class="stat salary">
        <div class="number">{{ salaryStr }} €</div>
        <div class="reference">Salary</div>
      </div>
    </div>
  </div>
</template>

<script>
const HLP = require('../assets/js/Helpers.js');

export default {
  name: 'PlayerCard',

  props: {
    player: Object,
  },

  computed: {
    fullName() { return this.player.firstName + " " + this.player.lastName; },
    position() { return this.player.positions.position; },
    age() { return this.player.age; },
    skill() { return this.player.skill; },
    salaryStr() { return HLP.moneyStr(this.player.salary); },
  },

}
</script>

<style lang="scss" scoped>

.player {
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  text-align: center;
  margin: 10px 0;
  padding: 20px 30px;
  border-radius: 8px;
  font-size: 30px;
  background-color: $col_module_background;
  transition: scale 0.1s ease-out, box-shadow 0.4s;
}

.name {
  text-align: left;
  width: 50%;
}

.stats {
  display: flex;
  justify-content: space-between;
  flex-grow: 1;
}

.stat-numbers {
  display: flex;
  justify-content: space-between;
  flex-grow: 1;
}

.stat {
  display: flex;
  flex-direction: column;
}

.reference {
  font-size: 16px;
  opacity: .5;
}

.salary {
  text-align: right;
  flex-grow: 1;
  max-width: 150px;
}

.player:hover {
  scale: 1.01;
  cursor: pointer;
  transition: scale 0.1s ease-out, box-shadow 0.4s;
}

@media screen and (max-width: $breakpoint_tablet) {
  .player {
    font-size: 20px;
  }
}

</style>