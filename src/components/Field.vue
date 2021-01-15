<template>
  <div class="aspect-wrapper">
    <div class="aspect-wrapper-inside">
      <div class="visu-wrapper">
        <div class="field-img">
          <img class="field-end-left" src="../assets/img/field-end.svg"/>
          <img src="../assets/img/field-mid.svg"/>
          <img class="field-end-right" src="../assets/img/field-end.svg"/>
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>

.aspect-wrapper {
  width: 100%;
  padding-top: 60%;
  position: relative;

  .aspect-wrapper-inside {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }
}

.visu-wrapper {
  width: 100%;
  height: 100%;
  overflow: auto;
  display: flex;
  flex-direction: column;
  background: $col_field_background;
  position: relative;
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
  z-index: 10000;
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

</style>