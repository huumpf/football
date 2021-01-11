<template>
  <div class="player">
    <div class="stat name">{{ fullName }}</div>
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
    <div class="stat salary">
      <div class="number">{{ salaryStr }} €</div>
      <div class="reference">per Season</div>
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
  border-radius: 8px;
  font-size: 30px;
  line-height: 34px;
  background-color: $col_module_background;
  box-shadow: 0 20px 40px rgba(0,0,0,0.05);
  transition: scale 0.1s ease-out, box-shadow 0.4s;

  .stat {
    display: flex;
    flex-direction: column;

    .reference {
      font-size: 16px;
      opacity: .5;
      letter-spacing: 1px;
    }
  }

  .name {
    text-align: left;
    min-width: 45%;
  }

  .salary {
      text-align: right;
  }
}

@media screen and (max-width: $breakpoint_tablet) {
    .player {
      font-size: 20px;
      line-height: 24px;
    }
}

.player:hover {
  scale: 1.01;
  cursor: pointer;
  transition: scale 0.1s ease-out, box-shadow 0.4s;
  box-shadow: 0 20px 60px rgba(0,0,0,0.08);
}

</style>