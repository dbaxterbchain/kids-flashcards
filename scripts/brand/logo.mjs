// Generates the Kids Flashcards logo mark as SVG: two flashcards (a white one with a gold star in front
// of a pink-to-yellow one) on a blue rounded square.
export const COLORS = {
  ink: '#0f172a',
  blue: '#2563eb',
  blueLight: '#4f8ef7',
  blueDark: '#1d4ed8',
  pink: '#ff7eb6',
  yellow: '#ffd166',
  gold: '#f5b301',
  goldDark: '#e08600',
};

const r = (value) => Math.round(value * 10) / 10;

function starPath(cx, cy, outer, inner) {
  const points = Array.from({ length: 10 }, (_, index) => {
    const angle = (-90 + index * 36) * (Math.PI / 180);
    const radius = index % 2 === 0 ? outer : inner;
    return `${r(cx + radius * Math.cos(angle))} ${r(cy + radius * Math.sin(angle))}`;
  });
  return `M${points.join(' L')} Z`;
}

/**
 * The mark's artwork in a 512 × 512 box. `scale` shrinks it around the center (for maskable icons,
 * whose edges may be cut off), and `background` draws the blue square behind it.
 */
export function logoSvg({ size = 512, background = 'rounded', scale = 1 } = {}) {
  const c = COLORS;
  const defs = `
    <linearGradient id="kf-bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${c.blueLight}"/><stop offset="1" stop-color="${c.blueDark}"/>
    </linearGradient>
    <radialGradient id="kf-glow" cx="0.25" cy="0.18" r="0.7">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.28"/><stop offset="1" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <linearGradient id="kf-back" x1="0" y1="0" x2="0.9" y2="1">
      <stop offset="0" stop-color="${c.yellow}"/><stop offset="1" stop-color="${c.pink}"/>
    </linearGradient>
    <linearGradient id="kf-star" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#ffd84d"/><stop offset="1" stop-color="${c.gold}"/>
    </linearGradient>`;
  const square =
    background === 'rounded'
      ? `<rect width="512" height="512" rx="116" fill="url(#kf-bg)"/><rect width="512" height="512" rx="116" fill="url(#kf-glow)"/>`
      : background === 'full'
        ? `<rect width="512" height="512" fill="url(#kf-bg)"/><rect width="512" height="512" fill="url(#kf-glow)"/>`
        : '';
  const card = (fill) => `<rect x="-104" y="-134" width="208" height="268" rx="34" fill="${fill}"/>`;
  const shadow = 'rgba(15, 23, 42, 0.22)';
  const art = `
    <g transform="translate(206 250) rotate(-13)">
      <g transform="translate(6 12)">${card(shadow)}</g>${card('url(#kf-back)')}
    </g>
    <g transform="translate(300 272) rotate(9)">
      <g transform="translate(6 12)">${card(shadow)}</g>${card('#ffffff')}
      <path d="${starPath(0, -6, 78, 36)}" fill="url(#kf-star)" stroke="url(#kf-star)" stroke-width="18" stroke-linejoin="round"/>
      <path d="${starPath(0, -6, 78, 36)}" fill="none" stroke="${c.goldDark}" stroke-width="5" stroke-linejoin="round" opacity="0.35"/>
    </g>
    <path d="M404 92 l9 24 l24 9 l-24 9 l-9 24 l-9 -24 l-24 -9 l24 -9 z" fill="#ffffff" opacity="0.95"/>
    <path d="M110 404 l6 15 l15 6 l-15 6 l-6 15 l-6 -15 l-15 -6 l15 -6 z" fill="#ffffff" opacity="0.8"/>`;
  const scaled = scale === 1 ? art : `<g transform="translate(256 256) scale(${scale}) translate(-256 -256)">${art}</g>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512"><defs>${defs}</defs>${square}${scaled}</svg>`;
}
