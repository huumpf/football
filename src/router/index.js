import { createRouter, createWebHistory } from 'vue-router'
import Draft from '../views/Draft.vue'

const routes = [
  {
    path: '/',
    name: 'Draft',
    component: Draft
  },
  {
    path: '/about',
    name: 'About',
    component: () => import(/* webpackChunkName: "about" */ '../views/About.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router