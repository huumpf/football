<template>
  <div class="player">
    <div class="position-wrapper">
      <PositionVisualisation :positions="positions" :small="true"/>
    </div>
    <div class="details-wrapper">
      <div class="name"><h3>{{ firstName }} {{ lastName }}</h3></div>
      <div class="card_line">
        <div class="position"><h2>{{ position }}</h2>Pos</div>
        <div class="skill"><h2>{{ skill }}</h2>Skill</div>
        <div class="age"><h2>{{ age }}</h2>Age</div>
      </div>
      <div class="salary">{{ salaryStr }} €</div>
    </div>
  </div>
</template>

<script>
import PositionVisualisation from '@/components/PositionVisualisation.vue';
const HLP = require('../assets/js/Helpers.js');

export default {
  name: 'PlayerCard',

  components: {
    PositionVisualisation,
  },

  props: {
    firstName: String,
    lastName: String,
    positions: Object,
    skill: Number,
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
  border-radius: 8px;
}

.player {
  display: flex;
  flex-direction: column;
  text-align: center;
  width: 280px;
  background-color: $col_module_background;
  margin: 20px;
  border-radius: 8px;
  transition: scale 0.1s ease-out, box-shadow 0.4s;
  box-shadow: 0 20px 40px rgba(0,0,0,0.05);
  border: 1px solid $col_module_border;
}

.player:hover {
  scale: 1.05;
  transition: scale 0.1s ease-out, box-shadow 0.4s;
  cursor: pointer;
  box-shadow: 0 20px 60px rgba(0,0,0,0.08);
}

.image {
  height: 140px;
  width:100%;
  background-color: $col_module_section;
  border-radius: 8px 8px 0 0;
}

.image > img {
  height:140px;
}

.card_line {
  display:flex;
  flex-direction: row;
  justify-content: space-evenly;
  border-bottom: 1px solid $col_module_border;
  border-top: 1px solid $col_module_border;
  padding: 20px 0;
}

.name, .salary {
  padding: 20px;
  flex-grow: 1;
}

</style>