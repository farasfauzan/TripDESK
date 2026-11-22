import { cityRoads, cityWater, pickupLocalRoads, pickupRoutes } from '../osmSemarang.js'
import { pickupKm } from '../semarangMapData.js'

const STAGE_RATIO = 424 / 212
const roadClasses = [
  'motorway',
  'trunk',
  'primary',
  'secondary',
  'tertiary',
  'unclassified',
  'residential',
  'living_street',
  'service',
]

// Bingkai peta lacak: mengikuti sebaran koridor rute tiap titik jemput.
const frameOf = (route, point) => {
  if (!route?.bbox) {
    const w = 1.2
    return `${point.x - w / 2} ${point.y - w / STAGE_RATIO / 2} ${w} ${w / STAGE_RATIO}`
  }
  const [minX, minY, maxX, maxY] = route.bbox
  const cx = (minX + maxX) / 2
  const cy = (minY + maxY) / 2
  const contentW = maxX - minX
  const contentH = maxY - minY
  const paddedW = contentW + 2 * (0.04 + contentW * 0.1)
  const paddedH = contentH + 2 * (0.04 + contentH * 0.12)
  const w = Math.min(1.6, Math.max(paddedW, paddedH * STAGE_RATIO))
  const h = w / STAGE_RATIO
  // Geser kamera sedikit ke utara: titik jemput tidak menempel di tepi bawah
  // (tempat chip "Titik jemput" berada).
  const y = cy - h / 2 + h * 0.13
  return `${cx - w / 2} ${y} ${w} ${h}`
}

export default function TrackingMap({
  label = 'LIVE · 8 mnt',
  live = true,
  pointName = 'titik jemput',
  active = true,
  pickupId = '',
}) {
  const point = pickupKm[pickupId] ?? pickupKm['SMG-3']
  const route = pickupRoutes[pickupId] ?? null
  // Peta lacak butuh jalan lingkungan, bukan cuma arteri.
  const roads = pickupLocalRoads[pickupId] ?? cityRoads
  const end = route?.end ?? [point.x, point.y]
  const viewBox = frameOf(route, point)

  return (
    <section className="track-map" aria-label={`Peta armada menuju ${pointName}`}>
      <svg viewBox={viewBox} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect x={point.x - 20} y={point.y - 20} width="60" height="60" fill="#fbf3e6" />
        <path d={cityWater.sea} fill="#dfeaf0" />
        <path d={cityWater.lakes} fill="#bcdae7" />
        <path d={cityWater.rivers} className="r-river" />

        {roadClasses.map((cls) => (
          <path key={`c-${cls}`} d={roads[cls] ?? ''} className={`r-casing r-${cls}`} />
        ))}
        {roadClasses.map((cls) => (
          <path key={cls} d={roads[cls] ?? ''} className={`r-fill r-${cls}`} />
        ))}

        {route ? (
          <>
            <path d={route.d} className="track-route-base" />
            <path d={route.d} className="track-route-line" />
          </>
        ) : null}

        <g className="track-car" transform={active ? undefined : `translate(${end[0]} ${end[1]})`}>
          <circle r="0.035" fill="#ffffff" stroke="#c0492b" strokeWidth="0.006" />
          <g transform="translate(-0.017 -0.012) scale(0.0015)">
            <path
              d="M1 16V9.6c0-.9.7-1.6 1.6-1.6h8.8c.4 0 .8.1 1.1.4l5 4.4c.3.3.5.7.5 1.2v2"
              fill="none"
              stroke="#c0492b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <path d="M1 16h18" stroke="#c0492b" strokeWidth="2" strokeLinecap="round" />
            <path
              d="M10.6 8v4.8H19"
              fill="none"
              stroke="#c0492b"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            <circle cx="5.6" cy="17.6" r="2.1" fill="#c0492b" />
            <circle cx="15.4" cy="17.6" r="2.1" fill="#c0492b" />
          </g>
          {active && route ? (
            <animateMotion
              dur="7s"
              repeatCount="indefinite"
              keyPoints="0;0.88;0.88"
              keyTimes="0;0.8;1"
              calcMode="linear"
              path={route.d}
            />
          ) : null}
        </g>

        <g transform={`translate(${end[0]} ${end[1]})`}>
          <circle r="0.032" fill="#c0492b" opacity="0.18" />
          <circle r="0.015" fill="#c0492b" stroke="#ffffff" strokeWidth="0.005" />
        </g>

        <g transform={`translate(${end[0]} ${end[1] + 0.06})`}>
          <circle r="0.019" fill="#223c4a" stroke="#ffffff" strokeWidth="0.006" />
          <text x="0.03" y="0.007" className="track-you">
            Kamu
          </text>
        </g>
      </svg>

      <span className={`track-live${live ? ' is-live' : ''}`}>
        {live ? <i aria-hidden="true" /> : <span className="track-live-dot" aria-hidden="true" />}
        {label}
      </span>
      <span className="track-point">Titik jemput · {pointName}</span>
    </section>
  )
}
