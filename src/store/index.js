import { createStore } from 'vuex'
import { clubModule } from './Club'
import { teamModule } from './Team'
import { draftModule } from './Draft'
import { leagueModule } from './League'
import { transferMarketModule } from './TransferMarket'
import { authModule } from './Auth'

export default createStore({
  modules: {
    team: teamModule,
    club: clubModule,
    draft: draftModule,
    league: leagueModule,
    transferMarket: transferMarketModule,
    auth: authModule,
  }
})
