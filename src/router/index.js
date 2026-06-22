import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Draft',
    component: () => import('../views/Draft.vue')
  },
  {
    path: '/team',
    name: 'Team',
    meta: { showNav: true },
    component: () => import('../views/Team.vue')
  },
  {
    path: '/players',
    name: 'Players',
    meta: { showNav: true },
    component: () => import('../views/Players.vue')
  },
  {
    path: '/transfers',
    name: 'Transfers',
    meta: { showNav: true },
    component: () => import('../views/TransferMarket.vue')
  },
  {
    path: '/league',
    name: 'League',
    meta: { showNav: true },
    component: () => import('../views/Table.vue')
  },
  {
    path: '/league/:id',
    name: 'ClubLineup',
    meta: { showNav: true },
    component: () => import('../views/ClubLineup.vue')
  },
  {
    // The watched match runs full-screen with its own matchday top bar, so the
    // standard navigation is hidden here.
    path: '/match',
    name: 'Match',
    component: () => import('../views/MatchView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
