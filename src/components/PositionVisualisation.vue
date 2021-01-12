<template>
  <div class="aspect-wrapper">
    <div class="aspect-wrapper-inside">
      <div class="visu-wrapper">
        <div class="field-img">
          <img class="field-end-left" src="../assets/img/field-end.svg"/>
          <img src="../assets/img/field-mid.svg"/>
          <img class="field-end-right" src="../assets/img/field-end.svg"/>
        </div>
        <div class="left-side">
          <div class="counter">
            <p>{{ positionCount.lb }}</p>
            <div class="tile defense" v-for="index in positions.lb" :key="index"/>
          </div>
          <div class="counter">
            <p>{{ positionCount.lm }}</p>
            <div class="tile midfield" v-for="index in positions.lm" :key="index"/>
          </div>
          <div class="counter">
            <p>{{ positionCount.lf }}</p>
            <div class="tile offense" v-for="index in positions.lf" :key="index"/>
          </div>
        </div>
        <div class="center">
          <div class="counter counter-gk">
            <p>{{ positionCount.gk }}</p>
            <div class="tile goalkeeper" v-for="index in positions.gk" :key="index"/>
          </div>
          <div class="counter">
            <p>{{ positionCount.cb }}</p>
            <div class="tile defense" v-for="index in positions.cb" :key="index"/>
          </div>
          <div class="counter">
            <p>{{ positionCount.cm }}</p>
            <div class="tile midfield" v-for="index in positions.cm" :key="index"/>
          </div>
          <div class="counter">
            <p>{{ positionCount.st }}</p>
            <div class="tile offense" v-for="index in positions.st" :key="index"/>
          </div>
        </div>
        <div class="right-side">
          <div class="counter">
            <p>{{ positionCount.rb }}</p>
            <div class="tile defense" v-for="index in positions.rb" :key="index"/>
          </div>
          <div class="counter">
            <p>{{ positionCount.rm }}</p>
            <div class="tile midfield" v-for="index in positions.rm" :key="index"/>
          </div>
          <div class="counter">
            <p>{{ positionCount.rf }}</p>
            <div class="tile offense" v-for="index in positions.rf" :key="index"/>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'PositionVisualisation',

  props: {
    positions: Object,
    positionCount: Object,
  },
}
</script>

<style lang="scss" scoped>

.aspect-wrapper {
  padding-top: 50%;
  position: relative;
  margin: 30px;

  .aspect-wrapper-inside {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }
}

.smallContainerMargin {
  margin: 0;
}

.visu-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: $col_field_background;
  position: relative;
  // padding: 5% 13% 5% 3%;
  box-shadow: 0 20px 60px rgba(0,0,0,.2);
}

.field-img {
  position: absolute;
  display: flex;
  justify-content: space-between;
  width: 100%;
  top: 0;
  left: 0;
  bottom: 0;
  text-align: left;
  z-index: 100000;
  overflow: hidden;
}

.field-img > img {
  min-height: 100%;
  opacity: .4;
}

.field-img > .field-end-left {
  margin-left: -5%;
}

.field-img > .field-end-right {
  margin-right: -5%;
  transform: rotate(180deg);
}

.visu-wrapper > .left-side, .center, .right-side {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-grow: 2;
  justify-content: space-between;
}

.visu-wrapper > .center {
  flex-grow: 3;
}

.counter {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  position: relative;
  // filter: blur(1em);
}

.counter > p {
  color: $col_text_inverted;
  font-weight: bold;
  z-index: 100000;
}

.counter-gk {
  max-width: 9%;
}

.left-side, .right-side {
  margin-left: 9%;
}

.shifter {
  background-color: transparent;
}

.tile {
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
  bottom: 0;
  opacity: .01;
  // filter: blur(1em);
}

.defense {
  background-color: $col_defense;
}

.midfield {
  background-color: $col_progression;
}

.offense {
  background-color: $col_shot;
}

.goalkeeper {
  background-color: $col_goalkeeping;
}

</style>