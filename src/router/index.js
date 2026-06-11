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
    path: '/standings',
    name: 'Standings',
    meta: { showNav: true },
    component: () => import('../views/Table.vue')
  },
  {
    path: '/standings/:id',
    name: 'ClubLineup',
    meta: { showNav: true },
    component: () => import('../views/ClubLineup.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
