<template>
  <div class="match-lineup" :class="side">
    <div
      v-for="row in starters"
      :key="row.player.id"
      class="player"
    >
      <div class="name-group">
        <img v-if="row.scored" class="icon" src="../assets/img/icons/goal-white.svg" alt="Goal"/>
        <img v-if="row.assisted" class="icon" src="../assets/img/icons/assist-white.svg" alt="Assist"/>
        <img v-if="row.card === 'yellow'" class="icon" src="../assets/img/icons/yellowCard.svg" alt="Yellow card"/>
        <img v-if="row.card === 'red'" class="icon" src="../assets/img/icons/redCard.svg" alt="Red card"/>
        <InjuryIcon v-if="row.injured" :player="row.player" :injury="row.injuryData" :size="16"/>
        <img v-else-if="row.subbedOut" class="icon" src="../assets/img/icons/substitutionOut-white.svg" alt="Subbed out"/>
        <span class="name" :class="{ inactive: row.injured || row.subbedOut }">{{ row.player.lastName }}</span>
      </div>
      <FitnessRing class="fitness" :value="row.fitness" :size="14"/>
      <span class="rating">{{ formatRating(row.rating) }}</span>
      <span class="position">{{ row.position }}</span>
    </div>

    <div class="bench">
      <div
        v-for="row in bench"
        :key="row.player.id"
        class="player"
      >
        <div class="name-group">
          <InjuryIcon v-if="row.injured" :player="row.player" :injury="row.injuryData" :size="16"/>
          <img v-else-if="row.subbedOn" class="icon" src="../assets/img/icons/substitutionIn-white.svg" alt="Subbed on"/>
          <span class="name" :class="{ 'subbed-on': row.subbedOn }">{{ row.player.lastName }}</span>
        </div>
        <FitnessRing class="fitness" :value="row.player.fitness" :size="14"/>
        <span class="rating">{{ row.subbedOn ? formatRating(row.rating) : '–' }}</span>
        <span class="position">{{ row.position }}</span>
      </div>
    </div>
  </div>
</template>

<script>
import FitnessRing from '@/components/FitnessRing.vue';
import InjuryIcon from '@/components/InjuryIcon.vue';

export default {
  name: 'MatchLineupList',

  components: { FitnessRing, InjuryIcon },

  props: {
    // 'home' mirrors the row (name first, hugging the right edge toward the
    // pitch); 'away' reads position-first from the left edge.
    side: { type: String, required: true },
    // Starting XI rows: { player, position, rating:Number, fitness:Number,
    // scored, assisted, card:'yellow'|'red'|null, injured:Boolean, injuryData,
    // subbedOut:Boolean }. An injured player shows the injury icon (which wins
    // over sub-out); a subbed-off player shows the sub-out icon and stays here.
    // injuryData carries the in-match injury details for the icon's tooltip.
    starters: { type: Array, required: true },
    // Bench rows: { player, position, subbedOn:Boolean, rating:Number|null,
    // injured:Boolean, injuryData }. A substitute who came on shows the sub-in
    // icon and his live rating; everyone else shows a dash. (Reserve not passed.)
    bench: { type: Array, default: () => [] },
  },

  methods: {
    formatRating(rating) {
      return rating == null ? '–' : rating.toFixed(1);
    },
  },
}
</script>

<style lang="scss" scoped>
.match-lineup {
  display: flex;
  flex-direction: column;
  width: 224px;
  padding: 8px 12px 12px;
  font-family: $font_body;
  font-size: 12px;
  font-weight: 500;
  color: $col_text;
}

// A row reads name · rating · position. Rating and position are fixed columns;
// the name field flexes to fill the rest so a goal/assist marker stays glued to
// the name. The home (left) side packs toward the centre line and reads inward;
// the away (right) side mirrors it to position · rating · name.
.player {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 200px;
  padding: 4px 8px;
  border-radius: 4px;
}

.name-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1 1 auto;
  min-width: 0;
}

.fitness {
  flex-shrink: 0;
}

.name {
  flex: 0 1 auto;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.rating {
  flex-shrink: 0;
  width: 20px;
  text-align: center;
  opacity: 0.5;
}

.position {
  flex-shrink: 0;
  width: 26px;
  text-align: center;
  opacity: 0.5;
}

// Goal/assist markers, kept on the outer edge of the row beside the name.
.icon {
  flex-shrink: 0;
  width: 16px;
  height: 16px;
}

// Home: the name field packs against the centre-facing rating column, so the
// name is right-aligned with its marker just outside it.
.match-lineup.home .name-group {
  justify-content: flex-end;
}

.match-lineup.home .name {
  text-align: right;
}

// Away: mirror the row to position · rating · name. The name is left-aligned
// against the rating with its marker trailing on the outer edge.
.match-lineup.away .player {
  flex-direction: row-reverse;
}

.match-lineup.away .name-group {
  flex-direction: row-reverse;
  justify-content: flex-end;
}

.match-lineup.away .name {
  text-align: left;
}

// An injured or subbed-off starter reads dimmed in the XI list.
.name.inactive {
  opacity: 0.45;
}

// The bench is pushed below the XI and dimmed — they didn't take the pitch.
.bench {
  padding-top: 20px;
}

.bench .name {
  opacity: 0.5;
}

// A substitute who came on is no longer a benchwarmer — show him at full weight.
.bench .name.subbed-on {
  opacity: 1;
}
</style>
