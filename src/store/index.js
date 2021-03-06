import { createStore } from 'vuex'
import { clubModule } from './Club'
import { teamModule } from './Team'
import { draftModule } from './Draft'
import { leagueModule } from './League'

export default createStore({
  state: {
  },

  mutations: {
  },

  actions: {
  },

  modules: {
    team: teamModule,
    club: clubModule,
    draft: draftModule,
    league: leagueModule,
  }
})
