import { createStore } from 'vuex'
import { clubModule } from './Club'
import { teamModule } from './Team'

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
  }
})
