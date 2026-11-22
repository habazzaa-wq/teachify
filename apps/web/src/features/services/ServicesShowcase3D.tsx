import styles from "./services-showcase.module.css";

const ISO_X = Math.cos(Math.PI / 6);
const ISO_Y = Math.sin(Math.PI / 6);
const ORIGIN_X = 260;
const ORIGIN_Y = 320;

type Point3 = readonly [number, number, number];

function iso([x, y, z]: Point3): [number, number] {
  return [ORIGIN_X + (x - y) * ISO_X, ORIGIN_Y + (x + y) * ISO_Y - z];
}

function polygonPoints(corners: readonly Point3[]): string {
  return corners.map((corner) => iso(corner).join(",")).join(" ");
}

function segment(from: Point3, to: Point3) {
  const [x1, y1] = iso(from);
  const [x2, y2] = iso(to);
  return { x1, y1, x2, y2 };
}

const PLATFORM_TOP: readonly Point3[] = [
  [-110, -72, 18],
  [110, -72, 18],
  [110, 72, 18],
  [-110, 72, 18],
];

const PLATFORM_FRONT: readonly Point3[] = [
  [-110, 72, 18],
  [110, 72, 18],
  [110, 72, 0],
  [-110, 72, 0],
];

const PLATFORM_SIDE: readonly Point3[] = [
  [110, -72, 18],
  [110, 72, 18],
  [110, 72, 0],
  [110, -72, 0],
];

const BOOK_COVER_TOP: readonly Point3[] = [
  [-98, -48, 30],
  [-8, -48, 30],
  [-8, 38, 30],
  [-98, 38, 30],
];

const BOOK_LEFT_PAGE: readonly Point3[] = [
  [-94, -44, 34],
  [-54, -44, 34],
  [-54, 34, 34],
  [-94, 34, 34],
];

const BOOK_RIGHT_PAGE: readonly Point3[] = [
  [-50, -44, 34],
  [-12, -44, 34],
  [-12, 34, 34],
  [-50, 34, 34],
];

const CLIPBOARD_BORDER: readonly Point3[] = [
  [12, -42, 34],
  [92, -42, 34],
  [92, 42, 34],
  [12, 42, 34],
];

const CLIPBOARD_PANEL: readonly Point3[] = [
  [18, -36, 35],
  [86, -36, 35],
  [86, 36, 35],
  [18, 36, 35],
];

/** Hand-built isometric illustration: a service workbench with a guide book, a checklist and a consultation card. */
export function ServicesShowcase3D() {
  return (
    <div
      className={styles.scene}
      role="img"
      aria-label="رسمة ثلاثية الأبعاد لمنصة خدمات تعليمية: دليل معرفي وقائمة مهام واضحة وتواصل مباشر مع المختص"
    >
      <span className={styles.aura} aria-hidden="true" />

      <svg className={styles.art} viewBox="0 0 520 500" fill="none" aria-hidden="true">
        <defs>
          <radialGradient id="services-floor-shadow">
            <stop offset="0%" stopColor="#020617" stopOpacity="0.62" />
            <stop offset="100%" stopColor="#020617" stopOpacity="0" />
          </radialGradient>

          <linearGradient id="services-platform-top" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#263554" />
            <stop offset="100%" stopColor="#151E32" />
          </linearGradient>
          <linearGradient id="services-platform-front" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#131B2D" />
            <stop offset="100%" stopColor="#0E1525" />
          </linearGradient>
          <linearGradient id="services-platform-side" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1B2740" />
            <stop offset="100%" stopColor="#0C1220" />
          </linearGradient>

          <linearGradient id="services-book-cover" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--primary, #2B6CB0)" />
            <stop offset="100%" stopColor="var(--primary-deep, #163C68)" />
          </linearGradient>
          <linearGradient id="services-page" x1="0" y1="0" x2="0.8" y2="1">
            <stop offset="0%" stopColor="#FFFDF6" />
            <stop offset="100%" stopColor="#E6DFCE" />
          </linearGradient>
          <linearGradient id="services-coral" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--secondary, #F76C6C)" />
            <stop offset="100%" stopColor="var(--secondary-deep, #C9474B)" />
          </linearGradient>

          <filter id="services-drop" x="-40%" y="-40%" width="180%" height="200%">
            <feDropShadow dx="0" dy="18" stdDeviation="16" floodColor="#020617" floodOpacity="0.55" />
          </filter>
          <filter id="services-soft" x="-30%" y="-30%" width="160%" height="180%">
            <feDropShadow dx="0" dy="10" stdDeviation="9" floodColor="#020617" floodOpacity="0.45" />
          </filter>
        </defs>

        <ellipse cx="260" cy="408" rx="178" ry="30" fill="url(#services-floor-shadow)" />

        {/* Isometric workbench */}
        <g filter="url(#services-drop)">
          <polygon points={polygonPoints(PLATFORM_FRONT)} fill="url(#services-platform-front)" />
          <polygon points={polygonPoints(PLATFORM_SIDE)} fill="url(#services-platform-side)" />
          <polygon
            points={polygonPoints(PLATFORM_TOP)}
            fill="url(#services-platform-top)"
            stroke="var(--primary, #2B6CB0)"
            strokeOpacity="0.45"
            strokeWidth="1.4"
          />
          <line
            {...segment([-110, 72, 18], [110, 72, 18])}
            stroke="var(--secondary, #F76C6C)"
            strokeWidth="2.6"
            strokeLinecap="round"
            opacity="0.9"
          />
        </g>

        {/* Open guide book */}
        <g>
          <polygon
            points={polygonPoints([
              [-98, -48, 30],
              [-8, -48, 30],
              [-8, -48, 24],
              [-98, -48, 24],
            ])}
            fill="var(--primary-deep, #163C68)"
          />
          <polygon
            points={polygonPoints([
              [-8, -48, 30],
              [-8, 38, 30],
              [-8, 38, 24],
              [-8, -48, 24],
            ])}
            fill="var(--primary-deep, #163C68)"
          />
          <polygon
            points={polygonPoints([
              [-98, 38, 30],
              [-8, 38, 30],
              [-8, 38, 24],
              [-98, 38, 24],
            ])}
            fill="var(--primary-deep, #163C68)"
          />
          <polygon points={polygonPoints(BOOK_COVER_TOP)} fill="url(#services-book-cover)" />

          <polygon points={polygonPoints(BOOK_LEFT_PAGE)} fill="url(#services-page)" />
          <polygon
            points={polygonPoints([
              [-94, 34, 34],
              [-54, 34, 34],
              [-54, 34, 30],
              [-94, 34, 30],
            ])}
            fill="#D8D0BE"
          />
          <polygon points={polygonPoints(BOOK_RIGHT_PAGE)} fill="url(#services-page)" />
          <polygon
            points={polygonPoints([
              [-50, 34, 34],
              [-12, 34, 34],
              [-12, 34, 30],
              [-50, 34, 30],
            ])}
            fill="#D8D0BE"
          />
          <line
            {...segment([-52, -46, 34], [-52, 36, 34])}
            stroke="var(--primary-deep, #163C68)"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {[-28, -8, 12].map((y) => (
            <g key={y}>
              <line
                {...segment([-88, y, 34.6], [-60, y, 34.6])}
                stroke="#B9B1A1"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.85"
              />
              <line
                {...segment([-46, y, 34.6], [-18, y, 34.6])}
                stroke="#B9B1A1"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.85"
              />
            </g>
          ))}
        </g>

        {/* Checklist clipboard */}
        <g>
          <polygon
            points={polygonPoints([
              [12, 42, 34],
              [92, 42, 34],
              [92, 42, 24],
              [12, 42, 24],
            ])}
            fill="var(--secondary-deep, #C9474B)"
          />
          <polygon
            points={polygonPoints([
              [92, -42, 34],
              [92, 42, 34],
              [92, 42, 24],
              [92, -42, 24],
            ])}
            fill="var(--secondary-deep, #C9474B)"
          />
          <polygon points={polygonPoints(CLIPBOARD_BORDER)} fill="url(#services-coral)" />
          <polygon
            points={polygonPoints(CLIPBOARD_PANEL)}
            fill="#101828"
            stroke="var(--secondary, #F76C6C)"
            strokeWidth="1.6"
          />
          <line
            {...segment([44, -46, 36], [64, -46, 36])}
            stroke="var(--secondary, #F76C6C)"
            strokeWidth="7"
            strokeLinecap="round"
          />

          {[-20, 0, 20].map((y, index) => (
            <g key={y}>
              <polygon
                points={polygonPoints([
                  [26, y - 5, 35.6],
                  [36, y - 5, 35.6],
                  [36, y + 5, 35.6],
                  [26, y + 5, 35.6],
                ])}
                fill="none"
                stroke="var(--secondary, #F76C6C)"
                strokeWidth="1.6"
              />
              <path
                d={`M ${iso([28, y, 36])[0]} ${iso([28, y, 36])[1]} L ${iso([31, y + 3, 36])[0]} ${iso([31, y + 3, 36])[1]} L ${iso([35, y - 3, 36])[0]} ${iso([35, y - 3, 36])[1]}`}
                stroke="#F8FAFC"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <line
                {...segment([44, y, 35.6], [index === 1 ? 70 : 80, y, 35.6])}
                stroke="#D8DEE9"
                strokeWidth="2"
                strokeLinecap="round"
                opacity="0.75"
              />
            </g>
          ))}
        </g>

        {/* Direct consultation card */}
        <path
          d="M 320 262 C 350 226 374 194 388 168"
          stroke="var(--secondary, #F76C6C)"
          strokeWidth="1.6"
          strokeDasharray="4 7"
          strokeLinecap="round"
          fill="none"
          opacity="0.5"
        />
        <g transform="translate(340 96)">
          <g className={styles.bubble} filter="url(#services-soft)">
            <rect x="8" y="10" width="104" height="64" rx="20" fill="var(--secondary-deep, #C9474B)" />
            <path d="M34 60 L22 80 L54 62 Z" fill="var(--secondary-deep, #C9474B)" />
            <rect x="0" y="0" width="104" height="64" rx="20" fill="url(#services-coral)" />
            <path d="M30 58 L20 78 L50 60 Z" fill="url(#services-coral)" />
            <circle cx="32" cy="32" r="4.5" fill="#FFFFFF" opacity="0.96" />
            <circle cx="52" cy="32" r="4.5" fill="#FFFFFF" opacity="0.96" />
            <circle cx="72" cy="32" r="4.5" fill="#FFFFFF" opacity="0.96" />
          </g>
        </g>
      </svg>
    </div>
  );
}
