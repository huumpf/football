// Procedural club-crest generator.
//
// Two halves, by design:
//   generateCrest()  — IMPURE. Runs once per club at new-game setup. All the
//                      randomness and ALL colour/contrast resolution lives here.
//   crestToSvg()     — PURE. A flat switch over the descriptor's enum values.
//                      No Math.random, no colour maths — every colour it draws
//                      is already pre-resolved on the descriptor.
//
// The descriptor is plain JSON (13 primitive keys), so it stores straight onto
// a club and serialises with no special handling.

// --- Palette -----------------------------------------------------------------
// Team colours: saturated but not neon, so they don't vibrate on the dark-green
// UI. Black & white are NOT team colours; they only ever enter via INK / the
// charge medallion / outline (the two neutral constants below).
export const PALETTE = [
  '#C8102E', '#9B1B30', '#E1523D', '#D2691E', '#F2A900', '#FFC72C',
  '#1A7A4C', '#0B6E4F', '#046A38', '#0E7C7B', '#0033A0', '#0E4C92',
  '#1D2F6F', '#243B6B', '#3A7CA5', '#5B2A86', '#7A1FA2', '#6D214F',
  '#A50044', '#8B5A2B', '#5A3921', '#2E4057',
];

const INK_BLACK = '#141810';  // reads as black, but not a dead void on dark green
const SOFT_WHITE = '#F4F4F2';

const SHAPES = { classic: 5, roundel: 4, rounded: 3, spanish: 2 };
const FIELDS = { solid: 4, stripes: 4, halves: 3, hoops: 3, sash: 2, quarters: 2 };

// Clubs whose name spells out their colours wear them. The test is a substring
// over the whole name — only the club-name prefixes ever carry these tokens.
// Black & white are allowed as team colours here (the one exception to the
// neutrals-only rule), since the club is literally named after them.
const NAME_COLOURS = [
  { match: /rot-?wei[sß]/i, colours: ['#C8102E', SOFT_WHITE] },
  { match: /blau-?wei[sß]/i, colours: ['#0033A0', SOFT_WHITE] },
  { match: /schwarz-?wei[sß]/i, colours: [INK_BLACK, SOFT_WHITE] },
];

// --- Colour maths (generation only) ------------------------------------------
function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function lum(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) {
  const la = lum(a), lb = lum(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
function hue(hex) {
  const [r, g, b] = hexToRgb(hex).map(v => v / 255);
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  let h;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h *= 60;
  return h < 0 ? h + 360 : h;
}
function hueDist(a, b) {
  const d = Math.abs(hue(a) - hue(b)) % 360;
  return d > 180 ? 360 - d : d;
}
// The neutral that best separates the dark UI from an outermost field colour:
// white on a dark colour, black on a light one.
function inkFor(hex) { return lum(hex) < 0.40 ? SOFT_WHITE : INK_BLACK; }
// Highest-contrast colour to lay on top of `behind`, preferring white on ties.
function bestContrast(behind, candidates) {
  let best = null, bestR = -1;
  for (const c of candidates) {
    if (c === behind) continue;
    const r = ratio(behind, c) + (c === SOFT_WHITE ? 0.001 : 0);
    if (r > bestR) { bestR = r; best = c; }
  }
  return best;
}

// --- Random helpers ----------------------------------------------------------
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function chance(p) { return Math.random() < p; }
function weightedPick(weights) {
  const entries = Object.entries(weights);
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let roll = Math.random() * total;
  for (const [key, w] of entries) { if ((roll -= w) < 0) return key; }
  return entries[0][0];
}

// The colour the charge centre lands on (chief excluded — the charge sits below
// it). Only exact for solid fields; on patterned fields a medallion overrides
// it anyway, so a representative band colour is enough.
function colourUnderCentre(field, primary, alt, bands) {
  switch (field) {
    case 'stripes':
    case 'hoops':
      return Math.floor(bands / 2) % 2 ? alt : primary;
    case 'halves': return alt;
    case 'sash': return alt;
    case 'quarters': return primary;
    default: return primary;
  }
}

// Initials for the monogram charge, from the city token (the last word — the
// repeating "FC"/"SV"/"Borussia" prefix is dropped). One letter, promoted to
// two on a league-wide collision.
function initialsFromCity(name, used) {
  // The last word that starts with a letter: skips a trailing qualifier like
  // "(Oder)" in "Frankfurt (Oder)", and drops the "FC"/"SV" prefix naturally.
  const words = name.trim().split(/\s+/).filter(w => /^[A-Za-zÀ-ÿ]/.test(w));
  const city = words.pop() || name;
  const first = city[0].toUpperCase();
  let cand = first;
  if (chance(0.30) && city.length > 1) cand = first + city[1].toUpperCase();
  if (cand.length === 1 && used.initials.has(cand)) {
    cand = first + (city[1] ? city[1].toUpperCase() : 'C');
  }
  used.initials.add(cand);
  return cand;
}

// --- Generation (impure, once per club) --------------------------------------
export function generateCrest(clubName, used = { fields: new Set(), initials: new Set() }) {
  // A name that spells out its colours wears them; otherwise draw two colours
  // that read apart (distinct hue OR distinct lightness).
  const named = NAME_COLOURS.find(n => n.match.test(clubName));
  let primary, secondary;
  if (named) {
    [primary, secondary] = named.colours;
  } else {
    primary = pick(PALETTE);
    for (let i = 0; i < 24 && !secondary; i++) {
      const c = pick(PALETTE);
      if (c !== primary && (hueDist(c, primary) > 32 || Math.abs(lum(c) - lum(primary)) > 0.25)) secondary = c;
    }
    if (!secondary) secondary = inkFor(primary);
  }

  const shape = weightedPick(SHAPES);

  // Field drawn without replacement so each run of 6 clubs gets distinct
  // patterns; the set resets once exhausted (18 clubs, 6 fields).
  if (used.fields.size >= Object.keys(FIELDS).length) used.fields.clear();
  const available = Object.fromEntries(Object.entries(FIELDS).filter(([f]) => !used.fields.has(f)));
  let field = weightedPick(Object.keys(available).length ? available : FIELDS);
  // A named (two-colour) club shows both colours: never a plain solid field.
  // Prefer a pattern not yet used this cycle, keeping the de-dup intent.
  if (named && field === 'solid') {
    const opts = ['stripes', 'halves', 'hoops'].filter(f => !used.fields.has(f));
    field = pick(opts.length ? opts : ['stripes', 'halves', 'hoops']);
  }
  used.fields.add(field);

  const bands = field === 'stripes' ? pick([4, 6]) : field === 'hoops' ? pick([4, 5]) : 0;
  const patterned = field !== 'solid';

  const chief = patterned ? chance(0.20) : chance(0.45);
  const bordure = chance(0.30) && !(chief && field === 'solid');

  // Charge: patterned fields may stand alone; a solid field is never left blank.
  // cross/chevron are heraldic ordinaries that want to span the whole field, so
  // they're kept to solid fields where they sit cleanly; patterned fields take
  // the compact charges (which get a medallion so they never straddle a seam).
  const pool = patterned
    ? { none: 3, star: 3, monogram: 3, ball: 1, roundel: 1 }
    : { star: 3, monogram: 3, cross: 2, chevron: 2, ball: 2, roundel: 1 };
  const charge = weightedPick(pool);
  const monogram = charge === 'monogram' ? initialsFromCity(clubName, used) : '';

  // Resolve every render colour now.
  // `alt` is the pattern/contrast colour; only collapses to primary when truly
  // nothing uses it (solid field with no chief band).
  const alt = (field === 'solid' && !chief)
    ? primary
    : (ratio(primary, secondary) >= 1.8 ? secondary : SOFT_WHITE);

  const outer = field === 'solid' ? primary : alt;  // colour around most of the edge
  const ink = inkFor(outer);

  // What the charge sits on. A compact charge (star/roundel/monogram) on a
  // patterned field gets a solid neutral medallion so it sits on one flat
  // colour; the ball always gets a thin neutral backing so its white disc reads
  // even on a light field. cross/chevron (solid fields only) sit on the field.
  const fieldCentre = colourUnderCentre(field, primary, alt, bands);
  const medallioned = charge === 'ball'
    || (patterned && (charge === 'star' || charge === 'roundel' || charge === 'monogram'));
  const behind = medallioned ? inkFor(fieldCentre) : primary;
  const chargeColor = charge === 'none'
    ? primary
    : bestContrast(behind, [SOFT_WHITE, INK_BLACK, primary, secondary]);

  return { shape, field, bands, chief, bordure, charge, monogram, primary, secondary, alt, ink, chargeColor, behind };
}

// --- Rendering (pure switch over enums) --------------------------------------
const SHAPE_D = {
  classic: 'M8 6 H56 V34 C56 50 44 58 32 60 C20 58 8 50 8 34 Z',
  rounded: 'M12 6 H52 A6 6 0 0 1 58 12 V32 C58 49 46 57 32 61 C18 57 6 49 6 32 V12 A6 6 0 0 1 12 6 Z',
  spanish: 'M9 7 H55 V32 A23 23 0 0 1 9 32 Z',
};
function shapeNode(shape, attrs) {
  if (shape === 'roundel') return `<circle cx="32" cy="32" r="28" ${attrs}/>`;
  return `<path d="${SHAPE_D[shape]}" ${attrs}/>`;
}

function fieldNodes(d) {
  const { field, bands, alt } = d;
  switch (field) {
    case 'stripes': {
      const w = 64 / bands;
      return Array.from({ length: bands }, (_, i) =>
        i % 2 ? `<rect x="${i * w}" y="0" width="${w}" height="64" fill="${alt}"/>` : '').join('');
    }
    case 'hoops': {
      const h = 64 / bands;
      return Array.from({ length: bands }, (_, i) =>
        i % 2 ? `<rect x="0" y="${i * h}" width="64" height="${h}" fill="${alt}"/>` : '').join('');
    }
    case 'halves':
      return `<rect x="32" y="0" width="32" height="64" fill="${alt}"/>`;
    case 'sash':
      return `<rect x="24" y="-13" width="16" height="90" fill="${alt}" transform="rotate(45 32 32)"/>`;
    case 'quarters':
      return `<rect x="32" y="0" width="32" height="32" fill="${alt}"/>` +
             `<rect x="0" y="32" width="32" height="32" fill="${alt}"/>`;
    default:
      return '';
  }
}

// `count` evenly-spaced points on a circle, first point at the top.
function ring(cx, cy, r, count) {
  return Array.from({ length: count }, (_, i) => {
    const a = -Math.PI / 2 + i * 2 * Math.PI / count;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
}
function starPath(cx, cy, r, fill) {
  const pts = [];
  for (let i = 0; i < 10; i++) {
    const rad = i % 2 ? r * 0.42 : r;
    const a = -Math.PI / 2 + i * Math.PI / 5;
    pts.push(`${(cx + rad * Math.cos(a)).toFixed(2)},${(cy + rad * Math.sin(a)).toFixed(2)}`);
  }
  return `<polygon points="${pts.join(' ')}" fill="${fill}"/>`;
}

function chargeNodes(d) {
  const cx = 32, cy = d.chief ? 40 : 32;
  const { charge, chargeColor, behind, ink, field } = d;
  // Compact charges get a medallion on patterned fields (so they never straddle
  // a seam); the ball always gets a thin backing (so its white disc reads on a
  // light field); cross/chevron only appear on solid fields and sit on it.
  const medallioned = field !== 'solid' && (charge === 'star' || charge === 'roundel' || charge === 'monogram');
  const medallion = medallioned ? `<circle cx="${cx}" cy="${cy}" r="14" fill="${behind}"/>` : '';
  switch (charge) {
    case 'star':
      return medallion + starPath(cx, cy, 12, chargeColor);
    case 'ball': {
      // Stylised football: a thin neutral backing, a white disc, a central ink
      // pentagon and five short seams running out from its vertices.
      const hub = ring(cx, cy, 4.6, 5);
      const seams = hub.map(([x, y], i) => {
        const a = -Math.PI / 2 + i * 2 * Math.PI / 5;
        return `<line x1="${x.toFixed(2)}" y1="${y.toFixed(2)}" x2="${(cx + 9.5 * Math.cos(a)).toFixed(2)}" y2="${(cy + 9.5 * Math.sin(a)).toFixed(2)}" stroke="${INK_BLACK}" stroke-width="1.6"/>`;
      }).join('');
      return `<circle cx="${cx}" cy="${cy}" r="12.5" fill="${behind}"/>` +
        `<circle cx="${cx}" cy="${cy}" r="11" fill="${SOFT_WHITE}" stroke="${INK_BLACK}" stroke-width="1.3"/>` +
        `<polygon points="${hub.map(([x, y]) => `${x.toFixed(2)},${y.toFixed(2)}`).join(' ')}" fill="${INK_BLACK}"/>` +
        seams;
    }
    case 'cross':
      return `<rect x="${cx - 5}" y="${cy - 14}" width="10" height="28" fill="${chargeColor}"/>` +
             `<rect x="${cx - 14}" y="${cy - 5}" width="28" height="10" fill="${chargeColor}"/>`;
    case 'chevron': {
      const p = [
        [cx - 15, cy + 3], [cx, cy - 11], [cx + 15, cy + 3],
        [cx + 15, cy + 12], [cx, cy - 2], [cx - 15, cy + 12],
      ].map(([x, y]) => `${x},${y}`).join(' ');
      return `<polygon points="${p}" fill="${chargeColor}"/>`;
    }
    case 'roundel':
      return medallion +
        `<circle cx="${cx}" cy="${cy}" r="11" fill="${chargeColor}"/>` +
        `<circle cx="${cx}" cy="${cy}" r="5" fill="${behind}"/>`;
    case 'monogram': {
      const two = d.monogram.length > 1;
      return medallion +
        `<text x="${cx}" y="${cy + 1}" font-family="'Saira Extra Condensed', 'Arial Narrow', sans-serif" font-weight="800" ` +
        `font-size="${two ? 22 : 32}" letter-spacing="${two ? -1 : 0}" text-anchor="middle" ` +
        `dominant-baseline="central" paint-order="stroke" stroke="${ink}" stroke-width="1.5" ` +
        `fill="${chargeColor}">${d.monogram}</text>`;
    }
    default:
      return '';
  }
}

// Pure: turns a descriptor into a self-contained inline SVG string. `id` makes
// the clipPath id unique so many crests can share one DOM without cross-clipping.
export function crestToSvg(d, id = 0) {
  const clip = `crest-clip-${id}`;
  const parts = [];
  parts.push(`<clipPath id="${clip}">${shapeNode(d.shape, '')}</clipPath>`);
  parts.push(`<g clip-path="url(#${clip})">`);
  parts.push(`<rect x="0" y="0" width="64" height="64" fill="${d.primary}"/>`);
  parts.push(fieldNodes(d));
  if (d.chief) parts.push(`<rect x="0" y="0" width="64" height="14" fill="${d.alt}"/>`);
  parts.push('</g>');
  if (d.bordure) parts.push(shapeNode(d.shape, `fill="none" stroke="${d.ink}" stroke-width="9" clip-path="url(#${clip})"`));
  parts.push(chargeNodes(d));
  return `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;
}
