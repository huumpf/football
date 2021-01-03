<template>
  <div class="aspect-wrapper">
    <div class="aspect-wrapper-inside" v-bind:class="{ containerMargin: small }">
      <div class="visu-wrapper">
        <div class="field-img">
          <img class="field-end-left" src="../assets/img/field-end.svg"/>
          <img src="../assets/img/field-mid.svg"/>
          <img class="field-end-right" src="../assets/img/field-end.svg"/>
        </div>
        <div class="field-arrow"><img src="../assets/img/field-arrow.svg"/></div>
        <div class="left-side">
          <div class="counter" v-bind:class="{ smallBlur: small }">
            <div class="tile" v-for="index in positions.lb" :key="index"/>
          </div>
          <div class="counter" v-bind:class="{ smallBlur: small }">
            <div class="tile" v-for="index in positions.lm" :key="index"/>
          </div>
          <div class="counter" v-bind:class="{ smallBlur: small }">
            <div class="tile" v-for="index in positions.lf" :key="index"/>
          </div>
        </div>
        <div class="center">
          <div class="counter counter-gk" v-bind:class="{ smallBlur: small }">
            <div class="tile" v-for="index in positions.gk" :key="index"/>
          </div>
          <div class="counter" v-bind:class="{ smallBlur: small }">
            <div class="tile" v-for="index in positions.cb" :key="index"/>
          </div>
          <div class="counter" v-bind:class="{ smallBlur: small }">
            <div class="tile" v-for="index in positions.cdm" :key="index"/>
          </div>
          <div class="counter" v-bind:class="{ smallBlur: small }">
            <div class="tile" v-for="index in positions.cm" :key="index"/>
          </div>
          <div class="counter" v-bind:class="{ smallBlur: small }">
            <div class="tile" v-for="index in positions.cam" :key="index"/>
          </div>
          <div class="counter" v-bind:class="{ smallBlur: small }">
            <div class="tile" v-for="index in positions.st" :key="index"/>
          </div>
        </div>
        <div class="right-side">
          <div class="counter" v-bind:class="{ smallBlur: small }">
            <div class="tile" v-for="index in positions.rb" :key="index"/>
          </div>
          <div class="counter" v-bind:class="{ smallBlur: small }">
            <div class="tile" v-for="index in positions.rm" :key="index"/>
          </div>
          <div class="counter" v-bind:class="{ smallBlur: small }">
            <div class="tile" v-for="index in positions.rf" :key="index"/>
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
    small: Boolean,
  },

}
</script>

<style lang="scss" scoped>

.aspect-wrapper {
  width: 100%;
  padding-top: 60%;
  position: relative;
}

.aspect-wrapper-inside {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

.containerMargin {
  margin: 10px 10px 0;
}

.visu-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: $col_1700;
  position: relative;
  padding: 10px 50px 10px 10px;

  .field-arrow {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 0;
  left: 0;
  bottom: 0;
  width: 100%;
  visibility: hidden;
  }
}

.visu-wrapper > .field-arrow > img {
  height: 95%;
  margin-left:-6%;
}

.field-img {
  position: absolute;
  display: flex;
  justify-content: space-between;
  top: 0;
  width: 100%;
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
  margin-left: 20px;
}

.field-img > .field-end-right {
  margin-right: 20px;
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
  flex-grow: 1;
  position: relative;
  // border: 1px solid $col_module_border;
  // filter: blur(25px);
}
.smallBlur {
  filter: blur(9px);
}

.counter-gk {
  max-width: 40px;
}

.left-side, .right-side {
  margin-left: 40px;
}

.shifter {
  background-color: transparent;
}

.tile {
  background-color: rgba(0, 255, 0, 0.5);
  position: absolute;
  top: 0;
  width: 100%;
  left: 0;
  bottom: 0;
}

</style>