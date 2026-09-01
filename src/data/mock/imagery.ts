/* ============================================================================
   PLACEHOLDER IMAGERY
   Deterministic SVG data URIs so the POC is fully self-contained — no network,
   no flaky third-party image host. Colours come from a small curated set
   rather than a rotating hue, which is what made the earlier version clash.
   Purely a mock-data concern; nothing in the component layer knows these are
   generated, and they are the same across tenants because photography is
   content, not theme.
   ========================================================================= */

type Palette = {
  sky: [string, string, string];
  sun: string;
  ridgeFar: string;
  ridgeNear: string;
  sea: [string, string];
};

const PALETTES: Palette[] = [
  { // dusk
    sky: ['#241c46', '#6a4879', '#e5a583'], sun: '#ffdcbb',
    ridgeFar: '#493862', ridgeNear: '#291f3c', sea: ['#392e52', '#1a162c'],
  },
  { // coast
    sky: ['#0d3243', '#2c7789', '#a9d6d4'], sun: '#eaf8f5',
    ridgeFar: '#1e5666', ridgeNear: '#10333f', sea: ['#155b68', '#082b34'],
  },
  { // sand
    sky: ['#54331f', '#b0743f', '#f0cfa4'], sun: '#fff1d4',
    ridgeFar: '#6b4527', ridgeNear: '#402818', sea: ['#7a5b37', '#392918'],
  },
  { // alpine
    sky: ['#28374f', '#6a80a2', '#ccd8e6'], sun: '#f0f6fc',
    ridgeFar: '#42566f', ridgeNear: '#26344a', sea: ['#3a4f6c', '#1c2839'],
  },
  { // forest
    sky: ['#1a3024', '#4d7756', '#c2d8bd'], sun: '#e9f4e3',
    ridgeFar: '#2e4c37', ridgeNear: '#192d20', sea: ['#264232', '#112219'],
  },
  { // rose
    sky: ['#411d36', '#94486a', '#efb5ae'], sun: '#ffe1d9',
    ridgeFar: '#5c2a47', ridgeNear: '#37182b', sea: ['#542e47', '#271322'],
  },
];

const hash = (seed: string) => {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
};

export const img = (seed: string, w = 1600, h = 900) => {
  const n = hash(seed);
  const p = PALETTES[n % PALETTES.length];
  const horizon = 0.58 + ((n >> 3) % 14) / 100;
  const sunX = 0.18 + ((n >> 5) % 64) / 100;
  const peak = 0.26 + ((n >> 7) % 14) / 100;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid slice">
<defs>
<linearGradient id="a" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${p.sky[0]}"/>
<stop offset="55%" stop-color="${p.sky[1]}"/>
<stop offset="100%" stop-color="${p.sky[2]}"/>
</linearGradient>
<linearGradient id="b" x1="0" y1="0" x2="0" y2="1">
<stop offset="0%" stop-color="${p.sea[0]}"/>
<stop offset="100%" stop-color="${p.sea[1]}"/>
</linearGradient>
</defs>
<rect width="${w}" height="${h}" fill="url(#a)"/>
<circle cx="${w * sunX}" cy="${h * (horizon - 0.2)}" r="${h * 0.085}" fill="${p.sun}" opacity="0.9"/>
<path d="M0 ${h * horizon} L${w * 0.24} ${h * (horizon - peak * 0.62)} L${w * 0.46} ${h * horizon} Z" fill="${p.ridgeFar}"/>
<path d="M${w * 0.3} ${h * horizon} L${w * 0.58} ${h * (horizon - peak)} L${w * 0.88} ${h * horizon} Z" fill="${p.ridgeNear}"/>
<path d="M${w * 0.72} ${h * horizon} L${w * 0.92} ${h * (horizon - peak * 0.45)} L${w * 1.1} ${h * horizon} Z" fill="${p.ridgeFar}" opacity="0.8"/>
<rect y="${h * horizon}" width="${w}" height="${h * (1 - horizon)}" fill="url(#b)"/>
<rect y="${h * horizon}" width="${w}" height="${h * 0.008}" fill="${p.sun}" opacity="0.35"/>
<ellipse cx="${w * sunX}" cy="${h * (horizon + 0.08)}" rx="${w * 0.03}" ry="${h * 0.07}" fill="${p.sun}" opacity="0.14"/>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg.replace(/\n/g, ''))}`;
};
