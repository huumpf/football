<template>
  <div class="player-list">
    <div v-if="title || $slots['header-actions']" class="list-header">
      <span v-if="title" class="list-headline">{{ title }}</span>
      <span v-if="$slots['header-actions']" class="header-actions"><slot name="header-actions"/></span>
    </div>
    <ListRow header>
      <div v-if="numbered" class="rank">#</div>
      <div
        :class="['pos-col', 'sortable', { active: sortKey === 'position' }]"
        @click="sortBy('position')"
      >Pos<span class="arrow">{{ arrow('position') }}</span></div>
      <div
        :class="['name', 'sortable', { active: sortKey === 'name' }]"
        @click="sortBy('name')"
      >Name<span class="arrow">{{ arrow('name') }}</span></div>
      <div
        :class="['metric', 'sortable', { active: sortKey === 'skill' }]"
        @click="sortBy('skill')"
      >Skill<span class="arrow">{{ arrow('skill') }}</span></div>
      <div
        v-if="showDevelopment"
        :class="['metric', 'dev', 'sortable', { active: sortKey === 'development' }]"
        :title="devColumnTitle"
        @click="sortBy('development')"
      >Dev<span class="arrow">{{ arrow('development') }}</span></div>
      <div
        :class="['metric', 'sortable', { active: sortKey === 'age' }]"
        @click="sortBy('age')"
      >Age<span class="arrow">{{ arrow('age') }}</span></div>
      <div
        v-if="showSalary"
        :class="['metric', 'salary', 'sortable', { active: sortKey === 'salary' }]"
        @click="sortBy('salary')"
      >Salary<span class="arrow">{{ arrow('salary') }}</span></div>
      <div
        v-if="showValue"
        :class="['metric', 'value', 'sortable', { active: sortKey === 'value' }]"
        @click="sortBy('value')"
      >Value<span class="arrow">{{ arrow('value') }}</span></div>
      <div
        v-if="showClub"
        :class="['club', 'sortable', { active: sortKey === 'club' }]"
        @click="sortBy('club')"
      >Club<span class="arrow">{{ arrow('club') }}</span></div>
      <div v-if="$slots.actions" class="action-col" :style="{ width: actionWidth }"></div>
    </ListRow>

    <ListRow
      v-for="(player, index) in sortedPlayers"
      :key="player.id"
      class="item"
      :class="{ dragging: draggable && draggingId != null && player.id === draggingId }"
      :data-player-id="draggable ? player.id : null"
      :data-drop="draggable ? 'row' : null"
      :data-bucket="draggable ? dropKey : null"
    >
      <div v-if="numbered" class="rank">{{ index + 1 }}</div>
      <div class="pos-col">
        <span
          v-for="pos in positionList(player)"
          :key="pos.label"
          class="pos"
          :class="{ secondary: pos.secondary }"
        >{{ pos.label }}</span>
      </div>
      <div class="name">
        <span class="name-text">{{ player.firstName }} {{ player.lastName }}</span>
        <img
          v-if="isListed(player)"
          class="listed-icon"
          src="../assets/img/icons/transfer-white.svg"
          alt="Listed on transfer market"
          title="Listed on transfer market"
        />
      </div>
      <div class="metric">{{ player.skill }}</div>
      <div v-if="showDevelopment" class="metric dev">
        <span :class="['dev-delta', devClass(player)]">{{ devLabel(player) }}</span>
      </div>
      <div class="metric">{{ player.age }}</div>
      <div v-if="showSalary" class="metric salary">{{ formatSalary(player.salary) }}</div>
      <div v-if="showValue" class="metric value">{{ formatValue(player) }}</div>
      <div v-if="showClub" class="club">{{ player.clubName }}</div>
      <div v-if="$slots.actions" class="action-col" :style="{ width: actionWidth }">
        <slot name="actions" :player="player"/>
      </div>
    </ListRow>
  </div>
</template>

<script>
import ListRow from './ListRow.vue';
import { moneyStr, marketValue, developmentDelta } from '../assets/js/Helpers.js';
import { DEV_TIMEFRAMES } from '../assets/js/Config.js';

// Default sort direction per column. Position reads ascending (GK → RF),
// while skill/development/salary/value read best-first.
const DEFAULT_DIR = { position: 'asc', name: 'asc', skill: 'desc', development: 'desc', age: 'asc', salary: 'desc', value: 'desc', club: 'asc' };

export default {
  name: 'PlayerList',

  components: {
    ListRow,
  },

  props: {
    players: { type: Array, required: true },
    // Headline shown above the column labels (e.g. "Squad").
    title: { type: String, default: '' },
    // Overview shows salary; the draft sidebar hides it.
    showSalary: { type: Boolean, default: false },
    // Market value column (players overview and transfer market).
    showValue: { type: Boolean, default: false },
    // Selling club column; reads `clubName` off the player entries.
    showClub: { type: Boolean, default: false },
    // Squad page: skill-change ("Dev") column, measured over `timeframe`.
    showDevelopment: { type: Boolean, default: false },
    // A DEV_TIMEFRAMES key the development delta is measured over.
    timeframe: { type: String, default: 'season' },
    // Ids of players listed on the transfer market (marked with an icon).
    listedIds: { type: Object, default: null },
    // Team page: make rows drag handles + swap targets for the lineup editor.
    draggable: { type: Boolean, default: false },
    // Bucket this list represents ("bench" | "reserve"), tagged on each row so a
    // drop knows which card it landed in.
    dropKey: { type: String, default: '' },
    // Id of the player currently being dragged (its row shows at half opacity).
    draggingId: { type: [String, Number], default: null },
    // Prepend a 1-based rank column (like the League standings), so each row is
    // numbered by its place in the current order.
    numbered: { type: Boolean, default: false },
    // Width of the trailing actions cell. Wide enough for the market's text
    // buttons by default; lists with just the dots menu pass a snug value so the
    // button sits close to the column beside it.
    actionWidth: { type: String, default: '76px' },
  },

  data: () => {
    return {
      sortKey: 'position',
      sortDir: 'asc',
    }
  },

  computed: {
    devColumnTitle() {
      const label = (DEV_TIMEFRAMES.find(t => t.key === this.timeframe) || {}).label || '';
      return `Skill change · ${label}`;
    },

    sortedPlayers() {
      const dir = this.sortDir === 'asc' ? 1 : -1;
      return [...this.players].sort((a, b) => {
        const diff = this.sortValue(a, b);
        // Tiebreaker: higher skill first, so equal values stay readable.
        return (diff || b.skill - a.skill) * dir;
      });
    },
  },

  methods: {
    // All positions a player can fill as individual entries (primary first,
    // then secondary) so every position renders with the same spacing.
    positionList(player) {
      const p = player.positions;
      const primary = (p.primary || [p.position]).map(label => ({ label, secondary: false }));
      const secondary = (p.secondary || []).map(label => ({ label, secondary: true }));
      return [...primary, ...secondary];
    },

    sortValue(a, b) {
      switch (this.sortKey) {
        case 'position': return a.positions.sort - b.positions.sort;
        case 'name': return (a.lastName + a.firstName).localeCompare(b.lastName + b.firstName);
        case 'skill': return a.skill - b.skill;
        case 'development': return developmentDelta(a, this.timeframe) - developmentDelta(b, this.timeframe);
        case 'age': return a.age - b.age;
        case 'salary': return a.salary - b.salary;
        case 'value': return marketValue(a) - marketValue(b);
        case 'club': return (a.clubName || '').localeCompare(b.clubName || '');
      }
    },

    isListed(player) {
      return this.listedIds !== null && this.listedIds.has(player.id);
    },

    sortBy(key) {
      if (this.sortKey === key) {
        this.sortDir = this.sortDir === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortDir = DEFAULT_DIR[key];
      }
    },

    arrow(key) {
      if (this.sortKey !== key) return '';
      return this.sortDir === 'asc' ? ' ↑' : ' ↓';
    },

    formatSalary(salary) {
      return moneyStr(salary) + ' €';
    },

    formatValue(player) {
      return moneyStr(marketValue(player)) + ' €';
    },

    // Skill change over the selected timeframe, for the "Dev" column.
    devDelta(player) {
      return developmentDelta(player, this.timeframe);
    },
    devLabel(player) {
      const d = this.devDelta(player);
      return d > 0 ? `+${d}` : String(d);
    },
    devClass(player) {
      const d = this.devDelta(player);
      return d > 0 ? 'up' : d < 0 ? 'down' : 'zero';
    },
  },
}
</script>

<style lang="scss" scoped>

// Row height, padding and column gap come from the shared ListRow component;
// this component only defines its columns.
.player-list {
  display: flex;
  flex-direction: column;
  font-weight: 500;
}

// Leading rank column (opt-in via `numbered`). Just wide enough for the largest
// rank (two digits), with flex-shrink:0 so a one- to two-digit jump never nudges
// the columns after it; centered text keeps every row vertically aligned.
.rank {
  width: 16px;
  flex-shrink: 0;
  text-align: center;
}

// Sized to the two-position worst case (e.g. CDM CM); a player can hold at most
// two positions (CFG.MAX_TOTAL_POSITIONS), and no pair is two three-letter codes.
.pos-col {
  display: flex;
  gap: 0.3em;
  width: 48px;
  flex-shrink: 0;
  white-space: nowrap;
}

// Position values render thin (the header label stays Medium like the rest).
.item .pos-col {
  font-weight: 300;
}

.name {
  display: flex;
  align-items: center;
  flex: 1 1 auto;
  min-width: 0;
  white-space: nowrap;
}

.name-text {
  overflow: hidden;
  text-overflow: ellipsis;
}

.listed-icon {
  width: 12px;
  height: 12px;
  flex-shrink: 0;
  margin-left: 6px;
  opacity: 0.8;
}

.metric {
  width: 42px;
  flex-shrink: 0;
  text-align: center;
}

// Skill-change column: green when up, red when down, default text at zero.
.metric.dev {
  width: 38px;
}

.dev-delta {
  font-weight: 600;

  &.up { color: $col_2000; }
  &.down { color: #d64545; }
}

// Title row: list headline on the left, optional header controls on the right.
.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-actions {
  display: inline-flex;
  align-items: center;
  padding-right: 8px;
}

.salary,
.value {
  width: 90px;
}

.club {
  width: 110px;
  flex-shrink: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

// Per-row action cell (dots menu, buy button). Width comes from the actionWidth
// prop (applied to header and rows alike, so the columns stay aligned).
.action-col {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

// The rank reads as quiet metadata, dialled back like the position labels.
.item .rank {
  font-weight: 300;
  opacity: 0.5;
}

// Position values: primary readable, secondary fainter.
.item .pos-col .pos {
  opacity: 0.5;
}

.item .pos-col .pos.secondary {
  opacity: 0.3;
}

// Draggable rows (team-page bench/reserve): grabbable, and dimmed while their
// player is the one in flight. touch-action keeps a drag from scrolling on touch.
.item[data-player-id] {
  cursor: grab;
  touch-action: none;
}

.item.dragging {
  opacity: 0.5;
}

.sortable {
  cursor: pointer;
  user-select: none;
  transition: color 0.15s ease;
}

.sortable:hover {
  color: $col_text;
}

.sortable.active {
  color: $col_cta;
}

.arrow {
  font-size: 0.8em;
}

</style>
