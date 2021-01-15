<template>

<div class="wrapper">

  <Field/>

  <div class="aspect">
    <div class="aspect-wrapper-inside">
      <div class="visualisation">
        <div class="left-side">
          <div class="counter">
            <p>{{ positionCount.lb }}</p>
            <div class="tile" v-for="index in positions.lb" :key="index"/>
          </div>
          <div class="counter">
            <p>{{ positionCount.lm }}</p>
            <div class="tile" v-for="index in positions.lm" :key="index"/>
          </div>
          <div class="counter">
            <p>{{ positionCount.lf }}</p>
            <div class="tile" v-for="index in positions.lf" :key="index"/>
          </div>
        </div>
        <div class="center">
          <div class="counter counter-gk">
            <p>{{ positionCount.gk }}</p>
            <div class="tile goalkeeper" v-for="index in positions.gk" :key="index"/>
          </div>
          <div class="counter">
            <p>{{ positionCount.cb }}</p>
            <div class="tile" v-for="index in positions.cb" :key="index"/>
          </div>
          <div class="counter">
            <p>{{ positionCount.cm }}</p>
            <div class="tile" v-for="index in positions.cm" :key="index"/>
          </div>
          <div class="counter">
            <p>{{ positionCount.st }}</p>
            <div class="tile" v-for="index in positions.st" :key="index"/>
          </div>
        </div>
        <div class="right-side">
          <div class="counter">
            <p>{{ positionCount.rb }}</p>
            <div class="tile" v-for="index in positions.rb" :key="index"/>
          </div>
          <div class="counter">
            <p>{{ positionCount.rm }}</p>
            <div class="tile" v-for="index in positions.rm" :key="index"/>
          </div>
          <div class="counter">
            <p>{{ positionCount.rf }}</p>
            <div class="tile" v-for="index in positions.rf" :key="index"/>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
</template>

<script>
import Field from '@/components/Field.vue'

export default {
  name: 'PositionVisualisation',

  props: {
    positions: Object,
    positionCount: Object,
  },

  components: {
    Field,
  }
}
</script>

<style lang="scss" scoped>

.wrapper {
  margin: 30px;
}

.aspect {
  width: 100%;
  padding-top: 60%;
  margin-top: -60%;
  position: relative;

  .aspect-wrapper-inside {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }
}

.visualisation {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  z-index: 2;
}

.left-side, .center, .right-side {
  display: flex;
  flex-grow: 1;
}

.left-side, .right-side {
  margin-left: 9%;
}

.counter {
  position: relative;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-grow: 1;
  // filter: blur(1em);
}

.counter > p {
  color: $col_text_inverted;
  font-weight: bold;
  z-index: 100000;
  width: 50px;
}

.counter-gk {
  max-width: 9%;
}

.tile {
  position: absolute;
  width: 100%;
  top: 0;
  left: 0;
  bottom: 0;
  opacity: .01;
  background-color: $col_visualisation;
  // filter: blur(1em);
}

</style>