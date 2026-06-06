<template>
  <div class="player">
    <div class="name">{{ fullName }}</div>
    <div class="stats">
      <div class="stat positions">
        <div class="number"><span
          v-for="pos in positionsList"
          :key="pos.label"
          class="pos"
          :class="{ 'secondary-pos': pos.secondary }"
        >{{ pos.label }}</span></div>
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
        <div class="reference">Salary</div>
      </div>
    </div>
  </div>
</template>

<script>
import * as HLP from '../assets/js/Helpers.js';

export default {
  name: 'PlayerCard',

  props: {
    player: Object,
  },

  computed: {
    fullName() { return this.player.firstName + " " + this.player.lastName; },
    positionsList() {
      const p = this.player.positions;
      const primary = (p.primary || [p.position]).map(label => ({ label, secondary: false }));
      const secondary = (p.secondary || []).map(label => ({ label, secondary: true }));
      return [...primary, ...secondary];
    },
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
  transition: transform 0.1s ease-out;
}

.player:hover {
  transform: scale(1.01);
  cursor: pointer;
}

.name {
  text-align: left;
  width: 40%;
}

// Fixed columns so Pos / Skill / Age / Salary line up vertically across cards.
// Values are right-aligned with a uniform column-gap, so the spacing between
// Pos, Skill and Age stays consistent regardless of the Pos column's width.
.stats {
  display: grid;
  grid-template-columns: 1fr 50px 50px 150px;
  align-items: center;
  column-gap: 10px;
  flex-grow: 1;
}

.stat {
  display: flex;
  flex-direction: column;
  text-align: right;
}

// Equal height for every value so the reference labels share one baseline.
.number {
  height: 40px;
  line-height: 40px;
}

.positions .number {
  white-space: nowrap;
}

.reference {
  font-size: 16px;
  opacity: .5;
}

// Separate positions by spacing only; secondary ones are faded.
.pos + .pos {
  margin-left: 0.4em;
}

.secondary-pos {
  color: $col_text_faded;
}

@media screen and (max-width: $breakpoint_tablet) {
  .player {
    font-size: 20px;
  }
  .number {
    height: 28px;
    line-height: 28px;
  }
}

</style>