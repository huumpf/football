import { api } from '@/assets/js/api.js';

// The game modules that make up a save. `auth` is deliberately excluded.
const GAME_MODULES = ['club', 'team', 'draft', 'league', 'transferMarket'];
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

  const snapshot = () => {
    const out = {};
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

  const flush = async () => {
    timer = null;
    try {
      await api.putSave(snapshot());
    } catch (e) {
      // Offline or session expired — the next mutation reschedules a save.
    }
  };

  store.subscribe((mutation) => {
    if (!enabled || mutation.type.startsWith('auth/')) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 1500);
  });

  const controller = {
    // Load the user's save and start autosaving. Returns whether a saved game
    // existed (false = brand-new account, which then runs the draft).
    async resume() {
      const { state } = await api.loadSave();
      if (state) {
        replaceGame(state);
      } else {
        controller.reset();
      }
      enabled = true;
      return !!state;
    },
    // Discard the in-memory game (back to the new-game baseline).
    reset() {
      replaceGame(clone(initial));
    },
    // Stop autosaving and wipe the game — used on logout.
    end() {
      enabled = false;
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      controller.reset();
    },
  };

  return controller;
}
