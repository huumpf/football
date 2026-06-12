<template>
  <div class="player-list">
    <div v-if="title" class="list-headline">{{ title }}</div>
    <ListRow header>
      <div
        :class="['pos-col', 'sortable', { active: sortKey === 'position' }]"
        @click="sortBy('position')"
      >Position<span class="arrow">{{ arrow('position') }}</span></div>
      <div
        :class="['name', 'sortable', { active: sortKey === 'name' }]"
        @click="sortBy('name')"
      >Name<span class="arrow">{{ arrow('name') }}</span></div>
      <div
        :class="['metric', 'sortable', { active: sortKey === 'skill' }]"
        @click="sortBy('skill')"
      >Skill<span class="arrow">{{ arrow('skill') }}</span></div>
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
      <div v-if="$slots.actions" class="action-col"></div>
    </ListRow>

    <ListRow
      v-for="player in sortedPlayers"
      :key="player.id"
      class="item"
    >
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
      <div class="metric">{{ player.age }}</div>
      <div v-if="showSalary" class="metric salary">{{ formatSalary(player.salary) }}</div>
      <div v-if="showValue" class="metric value">{{ formatValue(player) }}</div>
      <div v-if="showClub" class="club">{{ player.clubName }}</div>
      <div v-if="$slots.actions" class="action-col">
        <slot name="actions" :player="player"/>
      </div>
    </ListRow>
  </div>
</template>

<script>
import ListRow from './ListRow.vue';
import { moneyStr, marketValue } from '../assets/js/Helpers.js';

// Default sort direction per column. Position reads ascending (GK → RF),
// while skill/salary/value read best-first.
const DEFAULT_DIR = { position: 'asc', name: 'asc', skill: 'desc', age: 'asc', salary: 'desc', value: 'desc', club: 'asc' };

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
    // Ids of players listed on the transfer market (marked with an icon).
    listedIds: { type: Object, default: null },
  },

  data: () => {
    return {
      sortKey: 'position',
      sortDir: 'asc',
    }
  },

  computed: {
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

// Wide enough for the three-position worst case (CDM CM CAM).
.pos-col {
  display: flex;
  gap: 0.3em;
  width: 76px;
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

// Per-row action cell (dots menu, buy button); fixed so header and rows align.
.action-col {
  display: flex;
  justify-content: flex-end;
  width: 76px;
  flex-shrink: 0;
}

// Position values: primary readable, secondary fainter.
.item .pos-col .pos {
  opacity: 0.5;
}

.item .pos-col .pos.secondary {
  opacity: 0.3;
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
