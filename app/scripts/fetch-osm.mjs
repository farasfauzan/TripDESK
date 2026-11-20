// Ambil geometri asli dari OpenStreetMap (Overpass) lalu ubah ke km relatif
// terhadap pusat Semarang. Jalankan manual saat data perlu diperbarui:
//   node scripts/fetch-osm.mjs
// Hasilnya: src/osmSemarang.js (jangan diedit tangan).
import { writeFileSync } from 'node:fs'

const ENDPOINTS = [
  'https://overpass.openstreetmap.fr/api/interpreter',
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
]

const ORIGIN = { lat: -6.9667, lon: 110.4167 }
const KM_LAT = 110.57
const KM_LON = 111.32 * Math.cos((ORIGIN.lat * Math.PI) / 180)

const CITY_BBOX = '(-7.14,110.28,-6.87,110.56)'
const CAMPUS_BBOX = '(-7.064,110.425,-7.039,110.453)'
const CORE_BBOX = '(-7.058,110.4324,-7.0455,110.4452)'

const ROAD_CLASSES = 'motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service'
const CITY_CLASSES = 'motorway|trunk|primary|secondary|tertiary'
const CAMPUS_CLASSES = 'motorway|trunk|primary|secondary|tertiary|unclassified|residential|living_street|service'

const toKm = (lon, lat) => [
  (lon - ORIGIN.lon) * KM_LON,
  (ORIGIN.lat - lat) * KM_LAT,
]

// Douglas–Peucker sederhana; toleransi dalam km.
function simplify(points, tolerance) {
  if (points.length < 3) return points
  const sq = tolerance * tolerance
  const sqSegDist = (p, a, b) => {
    let [x, y] = a
    let dx = b[0] - x
    let dy = b[1] - y
    if (dx !== 0 || dy !== 0) {
      const t = ((p[0] - x) * dx + (p[1] - y) * dy) / (dx * dx + dy * dy)
      if (t > 1) {
        x = b[0]
        y = b[1]
      } else if (t > 0) {
        x += dx * t
        y += dy * t
      }
    }
    dx = p[0] - x
    dy = p[1] - y
    return dx * dx + dy * dy
  }
  const simplifyStep = (first, last, out) => {
    let maxSq = sq
    let index = -1
    for (let i = first + 1; i < last; i += 1) {
      const d = sqSegDist(points[i], points[first], points[last])
      if (d > maxSq) {
        index = i
        maxSq = d
      }
    }
    if (index > -1) {
      if (index - first > 1) simplifyStep(first, index, out)
      out.push(points[index])
      if (last - index > 1) simplifyStep(index, last, out)
    }
  }
  const out = [points[0]]
  simplifyStep(0, points.length - 1, out)
  out.push(points[points.length - 1])
  return out
}

const fmt = (n, precision = 3) => {
  const s = n.toFixed(precision)
  return s.replace(/^(-?)0\./, '$1.')
}

function toPath(ways, tolerance, precision = 3) {
  return ways
    .map((coords) => {
      const pts = simplify(coords, tolerance)
      const d = pts.map(([x, y]) => `${fmt(x, precision)} ${fmt(y, precision)}`).join(' ')
      return `M${d}`
    })
    .join('')
}

async function overpass(query) {
  let lastError = ''
  for (const endpoint of ENDPOINTS) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'TripdeskBuild/1.0' },
        body: new URLSearchParams({ data: query }),
      })
      if (!res.ok) {
        lastError = `${endpoint} → HTTP ${res.status}`
        continue
      }
      return await res.json()
    } catch (error) {
      lastError = `${endpoint} → ${error.message}`
    }
  }
  throw new Error(`Overpass gagal: ${lastError}`)
}

const geometryOf = (element) => element.geometry?.map(({ lon, lat }) => toKm(lon, lat)) ?? []

function groupByClass(elements, tolerance, precision = 3) {
  const groups = new Map()
  for (const element of elements) {
    const cls = element.tags?.highway
    if (!cls) continue
    const coords = geometryOf(element)
    if (coords.length < 2) continue
    if (!groups.has(cls)) groups.set(cls, [])
    groups.get(cls).push(coords)
  }
  const out = {}
  for (const [cls, ways] of groups) out[cls] = toPath(ways, tolerance, precision)
  return out
}

function closedAreaPath(elements, tolerance, precision = 2) {
  return elements
    .map((element) => {
      const coords = geometryOf(element)
      if (coords.length < 3) return ''
      const pts = simplify(coords, tolerance)
      return `M${pts.map(([x, y]) => `${fmt(x, precision)} ${fmt(y, precision)}`).join(' ')}Z`
    })
    .filter(Boolean)
    .join('')
}

function coastToSea(elements, top) {
  // Gabungkan semua segmen coastline jadi satu garis, urutkan barat → timur,
  // lalu tutup ke atas supaya jadi poligon laut.
  const pts = elements
    .flatMap((element) => geometryOf(element))
    .filter(([x]) => Number.isFinite(x))
    .sort((a, b) => a[0] - b[0])
  if (pts.length < 2) return ''
  const d = pts.map(([x, y]) => `${fmt(x, 2)} ${fmt(y, 2)}`).join(' ')
  return `M${d} L${fmt(pts[pts.length - 1][0], 2)} ${fmt(top, 2)} L${fmt(pts[0][0], 2)} ${fmt(top, 2)}Z`
}

async function main() {
  console.log('→ kota: jalan utama')
  const cityRoads = await overpass(
    `[out:json][timeout:90];way["highway"~"^(${CITY_CLASSES})$"]${CITY_BBOX};out geom;`,
  )

  console.log('→ kota: sungai, pantai, perairan')
  const cityWater = await overpass(
    `[out:json][timeout:90];(way["waterway"~"^(river|canal)$"]${CITY_BBOX};way["natural"="coastline"]${CITY_BBOX};way["natural"="water"]${CITY_BBOX};);out geom;`,
  )

  console.log('→ kampus: semua jalan')
  const campusRoads = await overpass(
    `[out:json][timeout:90];way["highway"~"^(${CAMPUS_CLASSES})$"]${CAMPUS_BBOX};out geom;`,
  )

  console.log('→ kampus: bangunan inti')
  const campusBuilding = await overpass(
    `[out:json][timeout:90];way["building"]${CORE_BBOX};out geom;`,
  )

  console.log('→ kampus: POI bernama')
  const campusPoi = await overpass(
    `[out:json][timeout:90];(node["amenity"~"^(university|college|hospital|school)$"]${CAMPUS_BBOX};node["leisure"="stadium"]${CAMPUS_BBOX};node["tourism"~"^(attraction|museum)$"]${CAMPUS_BBOX};way["amenity"~"^(university|hospital)$"]${CAMPUS_BBOX};);out geom;`,
  )

  console.log('→ kampus: ruang terbuka & air')
  const campusArea = await overpass(
    `[out:json][timeout:90];(way["leisure"~"^(park|pitch|garden)$"]${CAMPUS_BBOX};way["landuse"~"^(grass|forest|meadow)$"]${CAMPUS_BBOX};way["waterway"~"^(river|canal)$"]${CAMPUS_BBOX};way["natural"="water"]${CAMPUS_BBOX};);out geom;`,
  )

  const pick = (data, filter) => data.elements.filter((element) => element.type === 'way' && (!filter || filter(element)))

  const water = {
    rivers: toPath(
      pick(cityWater, (e) => /river|canal/.test(e.tags?.waterway ?? '')).map((e) => geometryOf(e)).filter((c) => c.length > 1),
      0.03,
      2,
    ),
    lakes: closedAreaPath(pick(cityWater, (e) => e.tags?.natural === 'water'), 0.03, 2),
    sea: coastToSea(pick(cityWater, (e) => e.tags?.natural === 'coastline'), -60),
  }

  const campusPois = campusPoi.elements
    .map((element) => {
      const name = element.tags?.name
      if (!name) return null
      const coords = element.type === 'node'
        ? toKm(element.lon, element.lat)
        : (() => {
            const pts = geometryOf(element)
            if (!pts.length) return null
            const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length
            const cy = pts.reduce((a, p) => a + p[1], 0) / pts.length
            return [cx, cy]
          })()
      if (!coords) return null
      return { name: name.replace(/^Universitas /, 'Univ. '), x: +coords[0].toFixed(3), y: +coords[1].toFixed(3) }
    })
    .filter(Boolean)
    .slice(0, 14)

  // Nama jalan asli: ambil satu label per nama unik, di titik tengah ruas terpanjang.
  const roadLabels = new Map()
  for (const element of pick(campusRoads)) {
    const name = element.tags?.name
    if (!name) continue
    const coords = geometryOf(element)
    if (coords.length < 2) continue
    let length = 0
    for (let i = 1; i < coords.length; i += 1) {
      length += Math.hypot(coords[i][0] - coords[i - 1][0], coords[i][1] - coords[i - 1][1])
    }
    if (length < 0.12) continue
    const best = roadLabels.get(name)
    if (!best || best.length < length) {
      const mid = coords[Math.floor(coords.length / 2)]
      roadLabels.set(name, { length, x: mid[0], y: mid[1] })
    }
  }
  const campusRoadLabels = [...roadLabels.entries()]
    .sort((a, b) => b[1].length - a[1].length)
    .slice(0, 10)
    .map(([name, info]) => ({
      name: name.replace(/^Jalan /, 'Jl. ').replace(/^Jl\. /, 'Jl. '),
      x: +info.x.toFixed(3),
      y: +info.y.toFixed(3),
    }))

  const campus = {
    roads: groupByClass(pick(campusRoads), 0.004, 3),
    buildings: closedAreaPath(pick(campusBuilding), 0.01, 2),
    green: closedAreaPath(pick(campusArea, (e) => e.tags?.leisure || e.tags?.landuse), 0.008, 2),
    water: closedAreaPath(
      pick(campusArea, (e) => e.tags?.natural === 'water' || /river|canal/.test(e.tags?.waterway ?? '')),
      0.006,
      2,
    ),
  }

  const output = `// Dibuat otomatis oleh scripts/fetch-osm.mjs — jangan diedit tangan.
// Sumber geometri: OpenStreetMap contributors (ODbL).
// Koordinat dalam km, titik nol = pusat Semarang (${ORIGIN.lat}, ${ORIGIN.lon}).
// +x timur, +y selatan.
export const OSM_ATTRIBUTION = 'Data peta © OpenStreetMap contributors'

export const cityRoads = ${JSON.stringify(groupByClass(pick(cityRoads), 0.025, 2), null, 0)}

export const cityWater = ${JSON.stringify(water, null, 0)}

export const campusMap = ${JSON.stringify(campus, null, 0)}

export const campusPois = ${JSON.stringify(campusPois, null, 0)}

export const campusRoadLabels = ${JSON.stringify(campusRoadLabels, null, 0)}
`

  writeFileSync(new URL('../src/osmSemarang.js', import.meta.url), output)

  const size = Buffer.byteLength(output)
  const sizeOf = (value) =>
    typeof value === 'string' ? value.length : Object.values(value).reduce((a, v) => a + sizeOf(v), 0)
  const stat = (label, obj) =>
    console.log(
      `   ${label}: ${Object.entries(obj)
        .map(([k, v]) => `${k}=${Math.round(sizeOf(v) / 1024)}kB`)
        .join(' ')}`,
    )
  console.log(`✓ src/osmSemarang.js ${Math.round(size / 1024)} kB`)
  stat('kota jalan', groupByClass(pick(cityRoads), 0.025, 2))
  stat('kota air', water)
  stat('kampus', campus)
  console.log(`   kampus POI: ${campusPois.length} label, jalan: ${campusRoadLabels.length} nama`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
