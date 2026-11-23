import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { javaCities, javaLabels, javaProvinces } from '../javaMapData.js'
import { KM_PER_UNIT, cityLabels, pickupKm } from '../semarangMapData.js'
import {
  OSM_ATTRIBUTION,
  campusMap,
  campusPois,
  campusRoadLabels,
  cityRoads,
  cityWater,
} from '../osmSemarang.js'
import { gsap, useGSAP } from '../animations.js'

// Satu peta, satu sumbu koordinat. Zoom = viewBox yang menyempit, bukan dua
// gambar yang saling ganti. Geometri kota & kampus berasal dari OpenStreetMap
// (lihat scripts/fetch-osm.mjs), diproyeksikan ke km relatif pusat Semarang.
const ISLAND = { x: 36.2, y: 68.5, w: 327.6, h: 131 }

const SEMARANG = javaCities.Semarang
const STAGE_RATIO = 460 / 370
const CITY_KM = 14 // lebar bingkai level kota: 5 km radius + napas
const CAMPUS_KM = 1.6
// Tinggi bingkai yang dipegang tetap, lebarnya mengikuti rasio panggung asli.
// Kartu Beranda memakai `slice` pada bingkai 14 × 11,26 km, jadi di layar sempit
// area yang benar-benar terlihat menyempit (mis. 11,87 km di panggung 390).
// Kalau panggung ini tetap memakai rasio desain 460/370 dengan `meet`, ia
// menampilkan 14 km penuh → skala peta melompat ~18% tepat saat serah-terima.
const CITY_H = CITY_KM / STAGE_RATIO / KM_PER_UNIT
const STREET_W = CAMPUS_KM / KM_PER_UNIT
const STREET_H = STREET_W / STAGE_RATIO
const stageRatioNow = () =>
  typeof window === 'undefined' ? STAGE_RATIO : Math.min(window.innerWidth || 460, 460) / 370

const KM_ART = `translate(${SEMARANG[0]} ${SEMARANG[1]}) scale(${1 / KM_PER_UNIT})`

const SEA_FILL = '#dfeaf0'
const WATER_FILL = '#bcdae7'
const LAND_FILL = javaProvinces.find((province) => province.name === 'Jawa Tengah')?.fill ?? '#fbf3e6'

const VIEWBOX = (cam) =>
  `${cam.x.toFixed(3)} ${cam.y.toFixed(3)} ${cam.w.toFixed(3)} ${cam.h.toFixed(3)}`

const contextCities = [
  { name: 'Surabaya', point: [268.8, 142.6] },
  { name: 'Malang', point: [264.8, 166.4] },
  { name: 'Banyuwangi', point: [322.7, 174.9] },
]

const roadClasses = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']
const campusRoadClasses = [...roadClasses, 'unclassified', 'residential', 'living_street', 'service']

// Slot armada relatif terhadap titik jemput, dalam km.
const carSlots = [
  [-3.2, -1.7],
  [1.1, -2.3],
  [-3.5, 0.9],
  [1.6, 1.3],
  [-0.9, 2.5],
  [2.7, -0.3],
]

const shortName = (name) => name.replace(/\s*\(.*\)$/, '')

const pointOf = (id) => {
  // Samakan default dengan pilihan awal ArmadaMap (SMG-1/Tembalang). Kalau
  // jatuh ke titik lain, peta meluncur ~6 km tepat setelah halaman mendarat.
  const km = pickupKm[id] ?? pickupKm['SMG-1']
  return {
    km,
    x: SEMARANG[0] + km.x / KM_PER_UNIT,
    y: SEMARANG[1] + km.y / KM_PER_UNIT,
  }
}

const cityCam = (point, ratio) => {
  const w = CITY_H * ratio
  return { x: point.x - w / 2, y: point.y - CITY_H / 2, w, h: CITY_H }
}

// Level kampus tetap memakai bingkai desain (1,6 km) — tidak ikut handoff, jadi
// tidak perlu menyesuaikan rasio panggung.
const streetCam = (point) => ({
  x: point.x - STREET_W / 2,
  y: point.y - STREET_H / 2,
  w: STREET_W,
  h: STREET_H,
})

// Opasitas tiap lapisan LOD per level kamera.
const LOD = {
  island: { labels: 1, city: 0, street: 0, stroke: 1 },
  local: { labels: 0, city: 1, street: 0, stroke: 0 },
  street: { labels: 0, city: 0, street: 1, stroke: 0 },
}

function CarChip({ item, slot, user, date, pickupId }) {
  const x = user.x + slot[0]
  const y = user.y + slot[1]
  return (
    <Link className="zm-car" to={`/jadwal/${item.id}?date=${date}${pickupId ? `&pickup=${pickupId}` : ''}`}>
      <rect x={x} y={y} width="2.6" height="1.1" rx="0.55" className="zm-car-box" />
      <g className="zm-car-glyph" transform={`translate(${x + 0.26} ${y + 0.3})`}>
        <rect x="0.1" y="0" width="0.44" height="0.19" rx="0.08" className="zm-car-window" />
        <rect x="0" y="0.16" width="0.63" height="0.33" rx="0.11" className="zm-car-body" />
        <rect x="0.11" y="0.24" width="0.19" height="0.16" rx="0.05" className="zm-car-window" />
        <rect x="0.34" y="0.24" width="0.19" height="0.16" rx="0.05" className="zm-car-window" />
      </g>
      <text x={x + 1.05} y={y + 0.5} className="zm-car-eta">
        {item.pickupEtaMinutes} mnt
      </text>
      <text x={x + 1.05} y={y + 0.9} className="zm-car-seat">
        {item.seatsLeft} kursi
      </text>
    </Link>
  )
}

export default function ZoomMap({
  view = 'local',
  origin = 'Semarang',
  destination = 'Jepara',
  armada = [],
  date,
  pickupId = '',
  pickupName = 'titik jemput',
}) {
  const root = useRef(null)
  const svgRef = useRef(null)
  const firstRun = useRef(true)

  const point = pointOf(pickupId)
  // Rasio panggung asli (bukan 460/370) supaya area yang tampil sama dengan
  // kartu Beranda pada lebar layar berapa pun.
  const [ratio, setRatio] = useState(stageRatioNow)
  const cam = useRef(view === 'island' ? { ...ISLAND } : cityCam(point, ratio))
  // Layer kampus (~140 kB path) baru dipasang saat benar-benar dibutuhkan,
  // supaya paint pertama halaman peta tidak berat.
  const [streetMounted, setStreetMounted] = useState(view === 'street')

  useEffect(() => {
    const el = root.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (!width || !height) return
      const next = width / height
      setRatio((prev) => (Math.abs(next - prev) > 0.01 ? next : prev))
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const to = javaCities[destination] ?? javaCities.Jepara
  const [x2, y2] = to
  const x1 = point.x
  const y1 = point.y
  const midX = (x1 + x2) / 2
  const midY = Math.min(y1, y2) - 20

  const dx = x2 - x1
  const dy = y2 - y1
  let originLabel = { x: x1 - 10, y: y1 + 3.5, anchor: 'end' }
  let destLabel = { x: x2 + 11, y: y2 + 3.5, anchor: 'start' }

  if (Math.abs(dx) < 24) {
    if (dy < 0) {
      originLabel = { x: x1, y: y1 + 18, anchor: 'middle' }
      destLabel = { x: x2, y: y2 - 11, anchor: 'middle' }
    } else {
      originLabel = { x: x1, y: y1 - 11, anchor: 'middle' }
      destLabel = { x: x2, y: y2 + 18, anchor: 'middle' }
    }
  } else if (dx < 0) {
    originLabel = { x: x1 + 10, y: y1 + 3.5, anchor: 'start' }
    destLabel = { x: x2 - 11, y: y2 + 3.5, anchor: 'end' }
  }

  // Label POI yang jatuh di pojok kanan-atas (tempat chip "Detail kampus" dan
  // tombol toggle) disembunyikan supaya tidak ketiban.
  const frameTop = point.km.y - (CAMPUS_KM / STAGE_RATIO) / 2
  const frameRight = point.km.x + CAMPUS_KM / 2
  const visiblePois = campusPois.filter(
    (poi) => !(poi.y < frameTop + 0.2 && poi.x > frameRight - 0.52),
  )

  const pickup = shortName(pickupName)
  const pickupChipWidth = 0.85 + pickup.length * 0.155
  const pickupStreetWidth = 0.07 + pickup.length * 0.021

  useEffect(() => {
    if (view === 'street') setStreetMounted(true)
  }, [view])

  useGSAP(
    () => {
      const svg = svgRef.current
      if (!svg) return undefined

      const lod = LOD[view] ?? LOD.local
      const target =
        view === 'island' ? ISLAND : view === 'street' ? streetCam(point) : cityCam(point, ratio)
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const apply = () => svg.setAttribute('viewBox', VIEWBOX(cam.current))
      const levelChanged = Math.abs(cam.current.w - target.w) > 0.01
      const syncLod = () => {
        gsap.set('.zm-labels', { autoAlpha: lod.labels })
        gsap.set('.zm-city', { autoAlpha: lod.city })
        gsap.set('.zm-street', { autoAlpha: lod.street })
        gsap.set('.zm-province', { attr: { 'stroke-opacity': lod.stroke } })
      }

      gsap.killTweensOf([cam.current, '.zm-labels', '.zm-city', '.zm-street', '.zm-province'])

      // Level sama: bisa jadi cuma titik jemput yang pindah. Samakan LOD
      // langsung (idempoten, aman untuk double-invoke) lalu geser kamera.
      if (reduce || !levelChanged) {
        syncLod()
        const moved = Math.abs(cam.current.x - target.x) + Math.abs(cam.current.y - target.y) > 0.002
        if (moved && !reduce && !firstRun.current) {
          gsap.to(cam.current, { ...target, duration: 0.5, ease: 'power1.out', onUpdate: apply })
        } else {
          Object.assign(cam.current, target)
          apply()
        }
        firstRun.current = false
        return undefined
      }

      // power1.out: kamera langsung bergerak di frame pertama lalu mendarat
      // halus. inOut bikin ~150 ms pembuka terasa diam.
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } })
      tl.to(cam.current, { ...target, duration: 0.72, ease: 'power1.out', onUpdate: apply }, 0)
        .to('.zm-labels', { autoAlpha: lod.labels, duration: 0.32 }, lod.labels ? 0.1 : 0)
        .to('.zm-city', { autoAlpha: lod.city, duration: 0.46 }, lod.city ? 0.12 : 0)
        .to('.zm-street', { autoAlpha: lod.street, duration: 0.46 }, lod.street ? 0.12 : 0)
        .to('.zm-province', { attr: { 'stroke-opacity': lod.stroke }, duration: 0.4 }, 0)

      return undefined
    },
    { scope: root, dependencies: [view, pickupId, ratio] },
  )

  return (
    <section className="zoom-map" ref={root} aria-label={`Peta rute ${origin} ke ${destination}`}>
      <svg ref={svgRef} viewBox={VIEWBOX(ISLAND)} preserveAspectRatio="xMidYMid meet">
        <rect x="-200" y="-200" width="900" height="700" fill={SEA_FILL} />

        <g aria-hidden="true">
          {javaProvinces.map((province) => (
            <path
              key={province.name}
              className="zm-province"
              d={province.d}
              fill={province.fill}
              stroke="#c7b79f"
              strokeWidth="0.9"
              strokeLinejoin="round"
            />
          ))}
        </g>

        {/* Level kota — geometri OpenStreetMap */}
        <g className="zm-city">
          <g transform={KM_ART} aria-hidden="true">
            <rect x="-22" y="-14" width="48" height="32" fill={LAND_FILL} />
            <path d={cityWater.sea} fill={SEA_FILL} />
            <path d={cityWater.lakes} fill={WATER_FILL} />
            <path d={cityWater.rivers} className="r-river" />
            <path d={campusMap.green} className="r-green" />

            {roadClasses.map((cls) => (
              <path key={`case-${cls}`} d={cityRoads[cls] ?? ''} className={`r-casing r-${cls}`} />
            ))}
            {roadClasses.map((cls) => (
              <path key={cls} d={cityRoads[cls] ?? ''} className={`r-fill r-${cls}`} />
            ))}

            {cityLabels.map((label) => (
              <text
                key={label.name}
                x={label.x}
                y={label.y}
                textAnchor="middle"
                className={label.size === 'big' ? 'zm-city-name' : 'zm-city-place'}
              >
                {label.name}
              </text>
            ))}
          </g>

          <g transform={KM_ART}>
            <circle cx={point.km.x} cy={point.km.y} r="5" className="zm-radius" />
            <circle
              cx={point.km.x}
              cy={point.km.y}
              r="0.22"
              fill="#223c4a"
              stroke="#fffdf9"
              strokeWidth="0.09"
            />
            <text x={point.km.x} y={point.km.y - 0.42} className="zm-user-label" textAnchor="middle">
              Lokasi kamu
            </text>

            {armada.slice(0, 6).map((item, index) => (
              <CarChip
                key={item.id}
                item={item}
                slot={carSlots[index]}
                user={point.km}
                date={date}
                pickupId={pickupId}
              />
            ))}

            <g className="zm-pickup">
              <rect
                x={point.km.x - pickupChipWidth / 2}
                y={point.km.y + 1.05}
                width={pickupChipWidth}
                height="0.78"
                rx="0.39"
                className="zm-car-box"
              />
              <circle
                cx={point.km.x - pickupChipWidth / 2 + 0.42}
                cy={point.km.y + 1.44}
                r="0.18"
                fill="#c0492b"
              />
              <text
                x={point.km.x - pickupChipWidth / 2 + 0.72}
                y={point.km.y + 1.56}
                className="zm-pickup-label"
              >
                {pickup}
              </text>
            </g>
          </g>
        </g>

        {/* Level kampus — geometri OpenStreetMap (dipasang saat perlu) */}
        {streetMounted ? (
        <g className="zm-street">
          <g transform={KM_ART} aria-hidden="true">
            <path d={campusMap.green} className="r-green" />
            <path d={campusMap.water} fill={WATER_FILL} />
            <path d={campusMap.buildings} className="r-building" />

            {campusRoadClasses.map((cls) => (
              <path key={`sc-${cls}`} d={campusMap.roads[cls] ?? ''} className={`r-casing r-${cls}`} />
            ))}
            {campusRoadClasses.map((cls) => (
              <path key={cls} d={campusMap.roads[cls] ?? ''} className={`r-fill r-${cls}`} />
            ))}

            {campusRoadLabels.map((label) => (
              <text key={label.name} x={label.x} y={label.y} textAnchor="middle" className="zm-road-name">
                {label.name}
              </text>
            ))}

            {visiblePois.map((poi) => (
              <g key={poi.name} className="zm-poi">
                <circle cx={poi.x} cy={poi.y} r="0.018" />
                <text x={poi.x + 0.03} y={poi.y + 0.011}>
                  {poi.name}
                </text>
              </g>
            ))}
          </g>

          <g transform={KM_ART}>
            <circle
              cx={point.km.x}
              cy={point.km.y}
              r="0.018"
              fill="#223c4a"
              stroke="#fffdf9"
              strokeWidth="0.005"
            />
            <text x={point.km.x} y={point.km.y - 0.024} className="zm-st-user" textAnchor="middle">
              Lokasi kamu
            </text>

            <g>
              <rect
                x={point.km.x - pickupStreetWidth / 2}
                y={point.km.y + 0.026}
                width={pickupStreetWidth}
                height="0.075"
                rx="0.0375"
                className="zm-st-box"
              />
              <circle
                cx={point.km.x - pickupStreetWidth / 2 + 0.042}
                cy={point.km.y + 0.0635}
                r="0.017"
                fill="#c0492b"
              />
              <text
                x={point.km.x - pickupStreetWidth / 2 + 0.074}
                y={point.km.y + 0.074}
                className="zm-st-pickup"
              >
                {pickup}
              </text>
            </g>
          </g>
        </g>
        ) : null}

        <g className="zm-labels" aria-hidden="true">
          <text x="44" y="82" className="java-sea-label">
            Laut Jawa
          </text>
          <text x="44" y="192" className="java-sea-label">
            Samudra Hindia
          </text>
          <text x="250" y="79" className="java-island-label" textAnchor="middle">
            PULAU JAWA
          </text>

          {javaLabels.map((label) => (
            <text
              key={label.name}
              x={label.x}
              y={label.y}
              className="java-province-label"
              textAnchor="middle"
            >
              {label.name}
            </text>
          ))}

          {contextCities.map((city) => (
            <g key={city.name} className="java-context-city">
              <circle cx={city.point[0]} cy={city.point[1]} r="1.6" />
              <text x={city.point[0]} y={city.point[1] - 5} textAnchor="middle">
                {city.name}
              </text>
            </g>
          ))}

          <path
            d={`M${x1} ${y1} Q${midX} ${midY} ${x2} ${y2}`}
            fill="none"
            stroke="#c0492b"
            strokeWidth="2.2"
            strokeDasharray="6 5"
            strokeLinecap="round"
          />

          <g>
            <circle cx={x1} cy={y1} r="6.5" fill="#223c4a" stroke="#fffdf9" strokeWidth="2" />
            <circle cx={x1} cy={y1} r="1.8" fill="#fffdf9" />
            <text
              x={originLabel.x}
              y={originLabel.y}
              className="java-city-label"
              textAnchor={originLabel.anchor}
            >
              Kamu
            </text>
          </g>

          <g>
            <circle cx={x2} cy={y2} r="7" fill="#c0492b" stroke="#fffdf9" strokeWidth="2" />
            <circle cx={x2} cy={y2} r="2.2" fill="#fffdf9" />
            <text
              x={destLabel.x}
              y={destLabel.y}
              className="java-city-label is-dest"
              textAnchor={destLabel.anchor}
            >
              {destination}
            </text>
          </g>
        </g>
      </svg>

      <span className="map-credit">{OSM_ATTRIBUTION}</span>
    </section>
  )
}
