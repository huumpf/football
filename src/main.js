import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import { createPersistence } from './store/persistence'

const app = createApp(App).use(store)

// One persistence controller for the whole app, shared with the views that
// start/end a session (Login, Navigation) via inject.
const persistence = createPersistence(store)
app.provide('persistence', persistence)

// Resolve who is logged in (and load their save) before installing the router,
// so its initial navigation and guard see real auth state. Installing the
// router any earlier kicks off that first navigation before auth is known and
// strands the user on /login.
async function boot() {
  try {
    await store.dispatch('auth/fetchMe')
    if (store.getters['auth/isAuthenticated']) {
      await persistence.resume()
    }
  } catch (e) {
    // API unreachable — fall through to the login screen.
  }
  app.use(router)
  app.mount('#app')
}

boot()
