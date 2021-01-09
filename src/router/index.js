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
    component: () => import(/* webpackChunkName: "team" */ '../views/Team.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router