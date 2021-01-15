<template>

  <div class="lineup-wrapper">
    <Field/>

    <div class="aspect">
      <div class="aspect-wrapper-inside">
        <div class="lineup">
          <div class="goalkeeper">
            <LineupItem v-for="index in formation.positions.gk" :key="index" :position="'GK'" :player="formation.players.gk[index-1]"/>
          </div>
          <div class="defense">
            <LineupItem v-for="index in formation.positions.lb" :key="index" :position="'LB'" :player="formation.players.lb[index-1]"/>
            <LineupItem v-for="index in formation.positions.cb" :key="index" :position="'CB'" :player="formation.players.cb[index-1]"/>
            <LineupItem v-for="index in formation.positions.rb" :key="index" :position="'RB'" :player="formation.players.rb[index-1]"/>
          </div>
          <div class="midfield">
            <LineupItem v-for="index in formation.positions.lm" :key="index" :position="'LM'" :player="formation.players.lm[index-1]"/>
            <LineupItem v-for="index in formation.positions.cdm" :key="index" :position="'CDM'" :player="formation.players.cdm[index-1]"/>
            <LineupItem v-for="index in formation.positions.cm" :key="index" :position="'CM'" :player="formation.players.cm[index-1]"/>
            <LineupItem v-for="index in formation.positions.cam" :key="index" :position="'CAM'" :player="formation.players.cam[index-1]"/>
            <LineupItem v-for="index in formation.positions.rm" :key="index" :position="'RM'" :player="formation.players.rm[index-1]"/>
          </div>
          <div class="offense">
            <LineupItem v-for="index in formation.positions.lf" :key="index" :position="'LF'" :player="formation.players.lf[index-1]"/>
            <LineupItem v-for="index in formation.positions.st" :key="index" :position="'ST'" :player="formation.players.st[index-1]"/>
            <LineupItem v-for="index in formation.positions.rf" :key="index" :position="'RF'" :player="formation.players.rf[index-1]"/>
          </div>
        </div>
      </div>
    </div>
  </div>

</template>

<script>
import Field from '@/components/Field.vue'
import LineupItem from '@/components/LineupItem.vue'

export default {
  name: 'Lineup',

  props: {
    formation: Object,
  },

  computed: {
    player() { return this.$store.state.team.players[0] },
  },

  components: {
    Field,
    LineupItem,
  },
}
</script>

<style lang="scss" scoped>

.aspect {
  width: 100%;
  padding-top: 60%;
  margin-top: -60%;
  margin-left: -60px;
  position: relative;
  z-index: 100000;

  .aspect-wrapper-inside {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }
}

.lineup {
  width: 100%;
  height: 100%;
  display: flex;
}

.goalkeeper, .defense, .midfield, .offense {
  flex-grow: 1;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  padding: 30px;
}

</style>
