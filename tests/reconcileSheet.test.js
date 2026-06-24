import { describe, it, expect } from 'vitest';
import { reconcileSheet } from '../src/assets/js/Helpers.js';

// After a save (JSON) round-trip, team.players and the formation sheets become
// separate objects sharing only ids. reconcileSheet (run on load via
// RECONCILE_FORMATIONS) must re-link the sheet to the canonical player objects,
// so per-player state written to team.players — like an injury — reaches the
// line-up the match and squad screens field.
describe('reconcileSheet re-links a sheet to the canonical players by id', () => {
  it('replaces divergent sheet copies with the live player objects', () => {
    // Canonical squad: player 2 is injured.
    const players = [
      { id: 1, positions: { position: 'GK' }, injury: null },
      { id: 2, positions: { position: 'CB' }, injury: { name: 'ACL tear', weeks: 30 } },
      { id: 3, positions: { position: 'ST' }, injury: null },
    ];
    // Sheet built from stale copies (same ids, different objects, no injury) —
    // exactly what a JSON-loaded save produces.
    const stale = id => ({ id, positions: { position: 'X' }, injury: null });
    const sheet = {
      lineup: { gk: [stale(1)], cb: [stale(2)] },
      bench: [stale(3)],
      reserve: [],
    };

    const relinked = reconcileSheet(sheet, players);

    // Every entry is now the canonical object (identity restored).
    expect(relinked.lineup.gk[0]).toBe(players[0]);
    expect(relinked.lineup.cb[0]).toBe(players[1]);
    expect(relinked.bench[0]).toBe(players[2]);
    // And the injury written to the canonical player is now visible via the sheet.
    expect(relinked.lineup.cb[0].injury).not.toBeNull();
  });
});
