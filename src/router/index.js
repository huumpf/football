import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  {
    path: '/',
    name: 'Draft',
    component: () => import(/* webpackChunkName: "draft" */ '../views/Draft.vue')
  },
  {
    path: '/team',
    name: 'Team',
    meta: { showNav: true },
    component: () => import(/* webpackChunkName: "team" */ '../views/Team.vue')
  },
  {
    path: '/players',
    name: 'Players',
    meta: { showNav: true },
    component: () => import(/* webpackChunkName: "players" */ '../views/Players.vue')
  },
  {
    path: '/tabelle',
    name: 'Tabelle',
    meta: { showNav: true },
    component: () => import(/* webpackChunkName: "table" */ '../views/Table.vue')
  },
  {
    path: '/tabelle/:id',
    name: 'ClubLineup',
    meta: { showNav: true },
    component: () => import(/* webpackChunkName: "table" */ '../views/ClubLineup.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router