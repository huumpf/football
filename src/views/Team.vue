<template>
  <div class="team-grid" @pointerdown="onPointerDown" @click.capture="onClickCapture">
    <div class="card field-card">
      <div class="formation-header">
        <h2 class="formation-title">Formation</h2>
        <div class="formation-select">
          <div class="select-wrapper" @click="formationsOpen = !formationsOpen">
            <span v-if="selectedFormation" class="formation-name">{{ selectedFormation.name }}</span>
            <svg class="caret" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 6.5l5 5 5-5"/>
            </svg>
            <DropdownMenu
              v-if="formationsOpen"
              :options="formationOptions"
              @select="selectFormation"
              @close="formationsOpen = false"
            />
          </div>
        </div>
        <span class="total-skill">Total skill: {{ lineupSkill }}</span>
      </div>

      <div class="field-wrapper">
        <Lineup
          v-if="lineupFormation"
          :formation="lineupFormation"
          editable
          :squad="players"
          :dragging-id="dragId"
          :hover-key="drag.hoverKey"
          @pick="placePlayer"
        />
      </div>
    </div>

    <div class="side-col">
      <div class="card squad-card">
        <div
          class="squad-section bench-section"
          :class="{ 'drop-hover': drag.active && drag.hoverKey === 'bench' }"
          data-drop="bench"
        >
          <PlayerList title="Bench" :players="bench" draggable drop-key="bench" :dragging-id="dragId" numbered action-width="24px">
            <template #actions="{ player }">
              <PlayerRowMenu :player="player"/>
            </template>
          </PlayerList>
        </div>

        <div
          class="squad-section reserve-section"
          :class="{ 'drop-hover': drag.active && drag.hoverKey === 'reserve' }"
          data-drop="reserve"
        >
          <PlayerList title="Reserve" :players="reserve" draggable drop-key="reserve" :dragging-id="dragId" numbered action-width="24px">
            <template #actions="{ player }">
              <PlayerRowMenu :player="player"/>
            </template>
          </PlayerList>
        </div>
      </div>
    </div>

    <!-- The dragged player floats under the cursor as a field pill (the look it
         has on the pitch), while its source row/slot stays at half opacity. -->
    <Teleport to="body">
      <div
        v-if="drag.active"
        class="drag-ghost"
        :style="{ left: drag.x + 'px', top: drag.y + 'px' }"
      >
        <LineupItem :position="drag.position" :player="drag.player"/>
      </div>
    </Teleport>
  </div>

</template>

<script>
import * as HLP from '../assets/js/Helpers.js';
import * as CFG from '../assets/js/Config.js';
import Lineup from '@/components/Lineup.vue';
import LineupItem from '@/components/LineupItem.vue';
import PlayerList from '@/components/PlayerList.vue';
import PlayerRowMenu from '@/components/PlayerRowMenu.vue';
import DropdownMenu from '@/components/DropdownMenu.vue';

// Matchday subs bench capacity (shared with the store auto-fill via Config);
// everyone outside the XI and the bench sits in the (unbounded) reserve.
const BENCH_SIZE = CFG.BENCH_SIZE;
// Pointer travel (px) before a press turns into a drag rather than a click, so
// the click-to-pick dropdown still works on a plain tap.
const DRAG_THRESHOLD = 5;

export default {
  name: "Team",

  data:() => {
    return {
      selectedFormation: null,
      formationsOpen: false,
      // Each squad player sits in exactly one bucket: an editable lineup slot
      // ({ pos: [player|null, …] }), the bench, or the reserve.
      lineup: {},
      bench: [],
      reserve: [],
      // Active drag: the floating ghost and which drop target it is over.
      drag: { active: false, player: null, position: '', x: 0, y: 0, hoverKey: '' },
      // Press in progress that may become a drag once it passes the threshold.
      dragCandidate: null,
      // Set on drop so the click synthesised after the pointer-up is swallowed.
      justDragged: false,
    }
  },

  created() {
    // Seed the saved sheets once (no-op if already filled), then load the active
    // formation's saved buckets into the editor.
    this.$store.dispatch('initFormations');
    this.loadActive();
  },

  beforeUnmount() {
    this.endDragListeners();
    document.body.classList.remove('dragging-player');
  },

  watch: {
    // A transfer settled while the manager sits here (e.g. an AI buys a listed
    // player on a week tick) reconciles the saved sheets in the store; reload so
    // the editor never shows a departed player.
    players() {
      this.loadActive();
    },
  },

  computed: {
    formations() { return this.$store.getters.formationsWithPlayers },
    players() { return this.$store.state.team.players },
    recommendedFormation() { return this.$store.getters.recommendedFormation },
    // Id of the player being dragged, so its source slot/row dims to 50%.
    dragId() { return this.drag.active && this.drag.player ? this.drag.player.id : null; },
    // Dropdown rows (Name | Total Skill), strongest formation first.
    formationOptions() {
      return [...this.formations]
        .sort((a, b) => b.skillSum - a.skillSum)
        .map(f => ({
          label: f.name,
          value: f.skillSum,
          formation: f,
          selected: this.selectedFormation && f.name === this.selectedFormation.name,
        }));
    },
    // Summed effective skill of the players currently placed in the editable
    // lineup, so the headline total reflects manual swaps, not the auto optimum.
    // Uses fieldSkill so an out-of-position placement counts at the reduced rate.
    lineupSkill() {
      let sum = 0;
      for (const [pos, slots] of Object.entries(this.lineup)) {
        for (const player of slots) {
          if (player) sum += HLP.fieldSkill(player, pos.toUpperCase());
        }
      }
      return sum;
    },
    // Feeds Lineup from the editable assignment rather than the auto one.
    lineupFormation() {
      return this.selectedFormation
        ? {
            positions: this.selectedFormation.positions,
            layout: this.selectedFormation.layout,
            players: this.lineup,
          }
        : null;
    },
  },

  methods: {
    selectFormation(option) {
      // Switching the dropdown sets the new default, then loads its saved sheet.
      this.$store.commit('SET_ACTIVE_FORMATION', option.formation.name);
      this.loadActive();
      this.formationsOpen = false;
    },

    // Load the active formation's saved sheet into the editor buffers. Clones
    // the containers (new lineup object / arrays) but keeps the same player
    // objects, so the in-place drag edits never mutate the store and player
    // identity (used by findLocation and the drag ghost) stays intact.
    loadActive() {
      const name = this.$store.state.team.activeFormation;
      this.selectedFormation = this.formations.find(f => f.name === name) || this.recommendedFormation;
      const sheet = this.$store.state.team.formations[name]
        || HLP.buildSheet(this.players, this.selectedFormation.positions, BENCH_SIZE);
      this.lineup = Object.fromEntries(
        Object.entries(sheet.lineup).map(([pos, slots]) => [pos, slots.slice()])
      );
      this.bench = [...sheet.bench];
      this.reserve = [...sheet.reserve];
    },

    // Save the editor's current buckets back to the store for the active
    // formation. Clones the containers so the store keeps its own arrays.
    persist() {
      this.$store.commit('SET_FORMATION_SHEET', {
        name: this.selectedFormation.name,
        lineup: Object.fromEntries(
          Object.entries(this.lineup).map(([pos, slots]) => [pos, slots.slice()])
        ),
        bench: [...this.bench],
        reserve: [...this.reserve],
      });
    },

    // Click-to-pick dropdown: setting a slot is just a move onto that slot.
    placePlayer({ position, slotIndex, player }) {
      this.performMove(player, { type: 'slot', pos: position.toLowerCase(), index: slotIndex });
      this.persist();
    },

    // ---- bucket model -----------------------------------------------------

    // Where a player currently lives, or null if (somehow) nowhere.
    findLocation(player) {
      for (const pos of Object.keys(this.lineup)) {
        const arr = this.lineup[pos];
        for (let i = 0; i < arr.length; i++) {
          if (arr[i] && arr[i].id === player.id) return { kind: 'slot', pos, index: i };
        }
      }
      let i = this.bench.findIndex(p => p.id === player.id);
      if (i >= 0) return { kind: 'bench', index: i };
      i = this.reserve.findIndex(p => p.id === player.id);
      if (i >= 0) return { kind: 'reserve', index: i };
      return null;
    },

    bucketOf(kind) { return kind === 'bench' ? this.bench : this.reserve; },

    // Write a value into a location in place (no index shift) — used for swaps,
    // so both swapped players keep their slot/index.
    setAt(loc, value) {
      if (loc.kind === 'slot') this.lineup[loc.pos][loc.index] = value;
      else this.bucketOf(loc.kind).splice(loc.index, 1, value);
    },

    // Vacate a location: empty a slot, or drop a row out of its bucket.
    removeAt(loc) {
      if (loc.kind === 'slot') this.lineup[loc.pos][loc.index] = null;
      else this.bucketOf(loc.kind).splice(loc.index, 1);
    },

    // Move `player` onto a drop target. Dropping onto an occupied slot or a row
    // swaps the two players; dropping onto a card adds the player to that bucket
    // (a full bench bumps its weakest player into the reserve).
    performMove(player, target) {
      const origin = this.findLocation(player);
      if (!origin) return;

      if (target.type === 'slot') {
        const occupant = this.lineup[target.pos][target.index];
        if (occupant && occupant.id === player.id) return; // dropped on itself
        this.lineup[target.pos][target.index] = player;
        if (origin.kind === 'slot') {
          // Field-to-field: the occupant takes the slot we vacated (or it empties).
          this.lineup[origin.pos][origin.index] = occupant;
        } else if (occupant) {
          // From a bucket onto an occupied slot: swap occupant into our old spot.
          this.bucketOf(origin.kind).splice(origin.index, 1, occupant);
        } else {
          // Onto an empty slot: just leave the bucket.
          this.bucketOf(origin.kind).splice(origin.index, 1);
        }
        return;
      }

      if (target.type === 'row') {
        // Dropped on a row inside a card. While that card has room the drop is
        // just an add — no benched player is displaced. Only a full bench falls
        // back to a direct swap with the row it landed on.
        const benchFull = target.bucket === 'bench' && this.bench.length >= BENCH_SIZE;
        if (!benchFull) return this.performMove(player, { type: target.bucket });

        const other = this.players.find(p => String(p.id) === String(target.id));
        if (!other || other.id === player.id) return;
        const otherLoc = this.findLocation(other);
        if (!otherLoc) return;
        this.setAt(origin, other);
        this.setAt(otherLoc, player);
        return;
      }

      // Dropped on the bench or reserve card.
      if (origin.kind === target.type) return; // already there
      this.removeAt(origin);
      const bucket = this.bucketOf(target.type);
      bucket.push(player);
      if (target.type === 'bench' && bucket.length > BENCH_SIZE) {
        let weakest = 0;
        for (let i = 1; i < bucket.length; i++) {
          if (bucket[i].skill < bucket[weakest].skill) weakest = i;
        }
        this.reserve.push(bucket.splice(weakest, 1)[0]);
      }
    },

    // ---- pointer-driven drag & drop --------------------------------------

    onPointerDown(e) {
      if (e.button != null && e.button !== 0) return; // primary button / touch only
      if (e.target.closest('.dropdown')) return;      // not a drag from an open picker
      const handle = e.target.closest('[data-player-id]');
      if (!handle) return;
      const player = this.players.find(p => String(p.id) === handle.getAttribute('data-player-id'));
      if (!player) return;
      this.justDragged = false;
      this.dragCandidate = { player, startX: e.clientX, startY: e.clientY };
      window.addEventListener('pointermove', this.onPointerMove);
      window.addEventListener('pointerup', this.onPointerUp);
      window.addEventListener('pointercancel', this.onPointerUp);
    },

    onPointerMove(e) {
      const c = this.dragCandidate;
      if (!c) return;
      if (!this.drag.active) {
        if (Math.hypot(e.clientX - c.startX, e.clientY - c.startY) < DRAG_THRESHOLD) return;
        const origin = this.findLocation(c.player);
        this.drag.player = c.player;
        this.drag.position = origin && origin.kind === 'slot'
          ? origin.pos.toUpperCase()
          : (c.player.positions.primary || [c.player.positions.position])[0];
        this.drag.active = true;
        document.body.classList.add('dragging-player');
      }
      this.drag.x = e.clientX;
      this.drag.y = e.clientY;
      this.drag.hoverKey = this.hoverKeyAt(e.clientX, e.clientY);
      e.preventDefault();
    },

    onPointerUp(e) {
      this.endDragListeners();
      const c = this.dragCandidate;
      this.dragCandidate = null;
      if (this.drag.active && c) {
        const target = this.dropTargetAt(e.clientX, e.clientY);
        if (target) {
          this.performMove(c.player, target);
          this.persist();
        }
        this.justDragged = true;
      }
      this.drag.active = false;
      this.drag.player = null;
      this.drag.hoverKey = '';
      document.body.classList.remove('dragging-player');
    },

    endDragListeners() {
      window.removeEventListener('pointermove', this.onPointerMove);
      window.removeEventListener('pointerup', this.onPointerUp);
      window.removeEventListener('pointercancel', this.onPointerUp);
    },

    // Resolve the drop target under a point from its [data-drop] attributes.
    dropTargetAt(x, y) {
      const t = this.dropElementAt(x, y);
      if (!t) return null;
      const kind = t.getAttribute('data-drop');
      if (kind === 'slot') return { type: 'slot', pos: t.getAttribute('data-pos'), index: +t.getAttribute('data-index') };
      if (kind === 'row') return { type: 'row', id: t.getAttribute('data-player-id'), bucket: t.getAttribute('data-bucket') };
      if (kind === 'bench' || kind === 'reserve') return { type: kind };
      return null;
    },

    // Highlight key for the target under the cursor: a precise slot, or the card
    // a row/empty-area belongs to.
    hoverKeyAt(x, y) {
      const t = this.dropElementAt(x, y);
      if (!t) return '';
      const kind = t.getAttribute('data-drop');
      if (kind === 'slot') return `slot:${t.getAttribute('data-pos')}:${t.getAttribute('data-index')}`;
      if (kind === 'row') return t.getAttribute('data-bucket') || '';
      return kind;
    },

    dropElementAt(x, y) {
      const el = document.elementFromPoint(x, y);
      return el ? el.closest('[data-drop]') : null;
    },

    onClickCapture(e) {
      if (this.justDragged) {
        e.stopPropagation();
        e.preventDefault();
        this.justDragged = false;
      }
    },
  },

  components: {
    Lineup,
    LineupItem,
    PlayerList,
    PlayerRowMenu,
    DropdownMenu,
  }
}
</script>

<style lang="scss" scoped>

// Responsive card grid mirroring the design: the field card grows, the squad
// column takes a fluid fixed-ish track and stacks below on narrow screens.
.team-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
  height: 100%;
}

.field-card {
  // Query container so lineup items can drop the first-name initial when
  // the card gets narrow (see LineupItem.vue).
  container: formation-card / inline-size;
  display: flex;
  flex-direction: column;
  min-width: 0;
  // Visible so a slot's player-picker dropdown isn't clipped by the card
  // (the pitch itself clips to its own rounded corners).
  overflow: visible;
}

.field-wrapper {
  width: 100%;
  margin-top: 12px;
  overflow: visible;
}

// Below the mobile breakpoint the pitch can no longer hold eleven cards
// without them colliding, so keep it at a usable width and let the field
// scroll horizontally instead of compressing the lineup into overlaps.
@media screen and (max-width: $breakpoint_mobile) {
  .field-wrapper {
    overflow-x: auto;
  }

  .field-wrapper :deep(.lineup-wrapper) {
    min-width: 680px;
  }
}

// Right column holds one squad card. Inside it the Bench section hugs its
// (capped) contents and the Reserve section takes the remaining height and
// scrolls; either can shrink and scroll if the column gets too short.
.side-col {
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.squad-card {
  display: flex;
  flex-direction: column;
  flex: 1 1 auto;
  min-height: 0;
  // Gap between the Bench and Reserve sections within the single card.
  gap: 12px;
}

.bench-section {
  flex: 0 1 auto;
  min-height: 0;
  overflow: auto;
}

.reserve-section {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
}

// Outline the section the dragged player is hovering over (drop = add to bucket).
.squad-section.drop-hover {
  outline: 2px dashed $col_cta;
  outline-offset: -2px;
  border-radius: 8px;
}

@media screen and (max-width: $breakpoint_tablet) {
  .team-grid {
    grid-template-columns: 1fr;
    height: auto;
  }

  // Stacked layout: sections grow with their content and the page scrolls.
  .bench-section,
  .reserve-section {
    overflow: visible;
  }
}

// Headline row per the design: three equal columns — the title left, the
// formation select centered, the lineup's total skill right-aligned.
.formation-header {
  display: flex;
  align-items: center;
  width: 100%;
  // Vertical-only padding so the title and total skill align flush with the
  // pitch below, which sits at the card's content edge.
  padding: 4px 0;
}

.formation-title {
  flex: 1 0 0;
  min-width: 0;
  text-align: left;
  font-size: 20px;
  font-weight: 500;
}

.formation-select {
  flex: 1 0 0;
  min-width: 0;
  display: flex;
  justify-content: center;
}

.total-skill {
  flex: 1 0 0;
  min-width: 0;
  text-align: right;
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

// Pill around the formation selector: faded white outline, rounded corners.
.select-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px 4px 12px;
  border: 1px solid $col_190_t10;
  border-radius: 8px;
  cursor: pointer;
  // Above the lineup boxes so the open panel overlays the field.
  z-index: $z_overlay;
}

.select-wrapper :deep(.dropdown) {
  width: max-content;
  // Centre the panel under the trigger (the shared slot picker keeps left:0).
  left: 50%;
  transform: translateX(-50%);
}

.formation-name {
  font-size: 14px;
  font-weight: 500;
  white-space: nowrap;
}

.caret {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

// Floating drag ghost: the field pill, centered on the cursor, lifted with a
// shadow. pointer-events:none so it never blocks the drop hit-test beneath it.
.drag-ghost {
  position: fixed;
  z-index: 1000;
  width: 160px;
  transform: translate(-50%, -50%) scale(1.06);
  pointer-events: none;
  filter: drop-shadow(0 8px 16px rgba(0, 0, 0, 0.45));
  // Teleported to <body>, outside #app, so restate the app's body font (and
  // colour) the pill would otherwise inherit — without it the text falls back
  // to the browser default serif.
  font-family: $font_body;
  color: $col_text;
}

</style>

<style>
/* Global only while a drag is in flight: a grabbing cursor everywhere and no
   accidental text selection. */
body.dragging-player,
body.dragging-player * {
  cursor: grabbing !important;
}

body.dragging-player {
  user-select: none;
}
</style>
