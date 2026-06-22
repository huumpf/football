import { createRouter, createWebHistory } from 'vue-router'
import store from '../store'

const routes = [
  {
    // The sign-in / create-account screen; the only route reachable signed out.
    path: '/login',
    name: 'Login',
    meta: { public: true },
    component: () => import('../views/Login.vue')
  },
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

// Everything but the login screen needs an account. The initial /me check has
// already resolved before the app mounts, so the guard sees real auth state.
router.beforeEach((to) => {
  const authed = store.getters['auth/isAuthenticated']
  if (to.meta.public) {
    return authed ? { name: 'Draft' } : true
  }
  return authed ? true : { name: 'Login' }
})

export default router
