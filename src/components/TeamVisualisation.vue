<template>
  <div class="visu-wrapper">
    <div class="left-side">
      <div class="counter">{{ positions.lb }}</div>
      <div class="counter">{{ positions.lm }}</div>
      <div class="counter">{{ positions.lf }}</div>
    </div>
    <div class="center">
      <div class="counter">{{ positions.gk }}</div>
      <div class="counter">{{ positions.cb }}</div>
      <div class="counter">{{ positions.cdm }}</div>
      <div class="counter">{{ positions.cm }}</div>
      <div class="counter">{{ positions.cam }}</div>
      <div class="counter">{{ positions.st }}</div>
    </div>
    <div class="right-side">
      <div class="counter">{{ positions.rb }}</div>
      <div class="counter">{{ positions.rm }}</div>
      <div class="counter">{{ positions.rf }}</div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'TeamVisualisation',

  props: {
    positions: Object,
  },

}
</script>

<style lang="scss" scoped>

.visu-wrapper {
  width: 100%;
  display: flex;
  flex-direction: column;
  background-color: $col_cta;
  padding: 30px;
}

.visu-wrapper > .left-side, .center, .right-side {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-grow: 1;
  justify-content: space-between;
}

.center {
  margin: 30px 0;
}

.left-side, .right-side {
  margin-left: 17.75%;
}

.counter {
  background-color: $col_module_background;
  height: 40px;
  width: 40px;
  border-radius: 20px;
  display:flex;
  align-items: center;
  justify-content: center;
}

</style>