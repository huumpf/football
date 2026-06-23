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
        <span class="name">{{ row.player.lastName }}</span>
      </div>
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
          <span class="name">{{ row.player.lastName }}</span>
        </div>
        <span class="rating">–</span>
        <span class="position">{{ row.position }}</span>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'MatchLineupList',

  props: {
    // 'home' mirrors the row (name first, hugging the right edge toward the
    // pitch); 'away' reads position-first from the left edge.
    side: { type: String, required: true },
    // Starting XI rows: { player, position, rating:Number, scored:Boolean,
    // assisted:Boolean, card:'yellow'|'red'|null }.
    starters: { type: Array, required: true },
    // Bench rows: { player, position }. They don't take the pitch, so their
    // rating shows as a dash. (Reserve players aren't passed to the match.)
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
  gap: 12px;
  width: 200px;
  padding: 4px 8px;
  border-radius: 4px;
}

.name-group {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1 1 auto;
  min-width: 0;
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

// The bench is pushed below the XI and dimmed — they didn't take the pitch.
.bench {
  padding-top: 20px;
}

.bench .name {
  opacity: 0.5;
}
</style>
