import { api } from '@/assets/js/api.js';

// The game modules that make up a save. `auth` is deliberately excluded.
const GAME_MODULES = ['club', 'team', 'draft', 'league', 'transferMarket'];
// Bump when the saved game's shape changes incompatibly: a save stamped with a
// different version is discarded (new game) instead of hydrated into garbage.
const SAVE_VERSION = 1;
const clone = (value) => JSON.parse(JSON.stringify(value));

// Owns the save lifecycle: hydrate the store from the server on login, autosave
// game changes (debounced), and wipe back to a pristine game on logout so a
// second account on the same browser never inherits the first one's squad.
export function createPersistence(store) {
  // The untouched game state captured before any hydration — the "new game"
  // baseline we restore on logout and reset.
  const initial = {};
  for (const module of GAME_MODULES) initial[module] = clone(store.state[module]);

  let enabled = false;
  let timer = null;
  let inFlight = null; // the putSave currently on the wire, if any

  const snapshot = () => {
    const out = { __v: SAVE_VERSION };
    for (const module of GAME_MODULES) out[module] = store.state[module];
    return out;
  };

  // replaceState swaps the whole tree, so keep auth and overwrite only the game
  // modules. replaceState does not fire subscribers, so this never autosaves.
  const replaceGame = (modules) => {
    const merged = { ...store.state };
    for (const module of GAME_MODULES) {
      if (modules[module] !== undefined) merged[module] = modules[module];
    }
    store.replaceState(merged);
  };

  const flush = () => {
    timer = null;
    inFlight = api
      .putSave(snapshot())
      .catch((e) => {
        // A 401 means the session is gone: stop autosaving and drop the local
        // login so the router guard sends the player back to sign in, rather
        // than silently failing every future save. Other errors (offline, 5xx)
        // are transient and the next mutation reschedules a save.
        if (e && e.status === 401) {
          enabled = false;
          store.commit('auth/SET_USER', null);
        }
      })
      .finally(() => {
        inFlight = null;
      });
    return inFlight;
  };

  store.subscribe((mutation) => {
    if (!enabled || mutation.type.startsWith('auth/')) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 1500);
  });

  // Best-effort save when the tab is hidden or closed. Not guaranteed on a hard
  // unload (a normal fetch can be killed), but it closes the common tab-switch
  // and navigate-away gaps the 1.5s debounce would otherwise drop.
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (enabled && document.visibilityState === 'hidden' && timer) {
        clearTimeout(timer);
        flush();
      }
    });
  }

  const controller = {
    // Load the user's save and start autosaving. Returns whether a compatible
    // save was loaded (false = brand-new account or an incompatible old save,
    // which then runs the draft).
    async resume() {
      const { state } = await api.loadSave();
      // A save written before versioning has no __v; it predates only the stamp,
      // not the shape, so treat it as v1. A genuinely incompatible future
      // version is discarded instead of hydrated into garbage.
      const compatible = state && (state.__v ?? 1) === SAVE_VERSION;
      if (compatible) {
        replaceGame(state);
      } else {
        // No save, or a save from an incompatible version: start a fresh game.
        controller.reset();
      }
      enabled = true;
      return !!compatible;
    },
    // Discard the in-memory game (back to the new-game baseline). The save on
    // the server is untouched — it's reloaded on the next login.
    reset() {
      replaceGame(clone(initial));
    },
    // Logout: stop autosaving, persist any change still inside the debounce
    // window (so nothing recent is lost), then wipe the local game. Must run
    // while the session is still valid, i.e. before clearing it server-side.
    async end() {
      enabled = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
        flush();
      }
      // Wait for any save still on the wire — whether just started here or a
      // debounced one that already fired — so the caller can clear the session
      // server-side without racing or losing the most recent change.
      if (inFlight) await inFlight;
      controller.reset();
    },
  };

  return controller;
}
