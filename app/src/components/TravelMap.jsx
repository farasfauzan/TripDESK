import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { cityFrameKm } from '../semarangMapData.js'
import { gsap } from '../animations.js'
import { cityRoads, cityWater } from '../osmSemarang.js'
import { ArrowRightIcon, FleetIcon, PinIcon, WeatherIcon } from './Icons.jsx'

// Bingkai peta Beranda = bingkai kota yang dipakai /armada. Isi snapshot
// transisi jadi identik, sehingga pergantian ke halaman tujuan tidak melompat.
const FRAME = cityFrameKm('SMG-1')
// Lebar bingkai mengikuti rasio panggung /armada (tinggi tetap). Tanpa ini,
// kartu istirahat (rasio 1,67) memakai skala 27,7 px/km sementara kartunya
// langsung jadi 370 px saat ditekan → peta snap zoom ~18% di frame pertama.
const stageAspect = () =>
  typeof window === 'undefined' ? 460 / 370 : Math.min(window.innerWidth || 460, 460) / 370
const stageFrameW = FRAME.h * stageAspect()
const FRAME_BOX = { x: FRAME.x + (FRAME.w - stageFrameW) / 2, y: FRAME.y, w: stageFrameW, h: FRAME.h }
const roadClasses = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']

// Titik contoh diambil dari geometri jalan asli, jadi chip armada selalu
// duduk di atas jalan berapa pun lebar kartunya.
const parseRoadPoints = (path) => {
  const numbers = (String(path).match(/-?\d*\.\d+|-?\d+/g) ?? []).map(Number)
  const points = []
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    // Lompati pasangan yang jelas bukan koordinat (pemisah path "M").
    points.push([numbers[i], numbers[i + 1]])
  }
  return points
}

const fleet = [
  { id: 'car-1', label: 'Hiace', delay: '0s' },
  { id: 'car-2', label: 'Elf', delay: '1.2s' },
  { id: 'car-3', label: 'Staria', delay: '2.1s' },
  { id: 'car-4', label: 'Hiace', delay: '0.6s' },
]

export default function TravelMap({ weather, ctaTo = '/cari' }) {
  const card = useRef(null)
  const svgRef = useRef(null)
  const expanding = useRef(false)
  // Penahan ruang selama morph: kartu keluar dari alur (position: fixed), jadi
  // ruangnya harus diganti supaya konten di bawah tidak melompat naik.
  const spacer = useRef(null)
  const navigate = useNavigate()
  const [size, setSize] = useState({ w: 424, h: 226 })

  useEffect(() => () => spacer.current?.remove(), [])

  useEffect(() => {
    const element = card.current
    if (!element || typeof ResizeObserver === 'undefined') return undefined
    const observer = new ResizeObserver(([entry]) => {
      // Saat kartu sedang melebar, viewBox dipegang animasi GSAP — jangan
      // ditimpa render React.
      if (expanding.current) return
      const { width, height } = entry.contentRect
      if (width && height) setSize({ w: width, h: height })
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  // Klik "Pesan": kartu peta melebar di tempat sampai selebar peta /armada,
  // frame ikut melebar (area lebih luas), baru pindah halaman.
  const expandThenGo = (event) => {
    event.preventDefault()
    if (expanding.current || !card.current) return
    expanding.current = true
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    // Kartu peta melebar dengan *clip reveal*: ukuran kotak langsung dipasang
    // sebesar panggung /armada, lalu clip-path dibuka dari posisi kartu asli.
    // Isi peta tidak pernah diskalakan/diregangkan, jadi tidak ada "jedug".
    const element = card.current
    const from = element.getBoundingClientRect()
    const shell = element.closest('.app-shell')
    const shellRect = shell ? shell.getBoundingClientRect() : from
    const target = { x: shellRect.x, y: shellRect.y, w: shellRect.width, h: 370 }

    if (reduced) {
      navigate(ctaTo, { state: { fromMapExpand: true } })
      return
    }

    const dy = Math.max(0, from.y - target.y)
    const clipBottom = Math.max(0, target.h - from.height)

    // Ganti ruang kartu di alur sebelum kartu diangkat jadi fixed, kalau tidak
    // seluruh isi halaman di bawahnya melompat naik setinggi kartu (CLS 0,20).
    const holder = document.createElement('div')
    holder.setAttribute('aria-hidden', 'true')
    holder.style.height = `${from.height}px`
    holder.style.marginInline = '-18px'
    element.parentNode?.insertBefore(holder, element)
    spacer.current = holder

    Object.assign(element.style, {
      position: 'fixed',
      left: `${target.x}px`,
      top: `${target.y}px`,
      width: `${target.w}px`,
      height: `${target.h}px`,
      margin: '0',
      zIndex: '60',
      willChange: 'transform, clip-path',
    })
    element.classList.add('is-expanding')

    const state = { y: dy, clip: clipBottom, radius: 22 }
    const render = () => {
      element.style.transform = `translateY(${state.y}px)`
      element.style.clipPath = `inset(0px 0px ${state.clip}px 0px round ${state.radius}px)`
    }
    render()

    gsap
      .timeline({
        defaults: { ease: 'power2.out' },
        onComplete: () => navigate(ctaTo, { state: { fromMapExpand: true } }),
      })
      .to(state, { y: 0, clip: 0, radius: 0, duration: 0.55, onUpdate: render }, 0)
      .to('.map-chip, .map-car, .map-user', { autoAlpha: 0, duration: 0.18 }, 0)
      // Konten di bawah kartu (layanan, rute, jadwal) memudar sebelum pindah
      // halaman. Tanpa ini, serah-terima = setengah layar berganti dalam satu
      // frame — terukur 11x lonjakan diff dibanding frame gerak biasa.
      .to('.page > *:not(.map-card), .map-bottom', { autoAlpha: 0, duration: 0.2 }, 0.33)
  }

  const frameW = FRAME_BOX.w
  const frameH = FRAME_BOX.h
  const frameAspect = frameW / frameH
  const cardAspect = size.w / size.h
  let visW = frameW
  let visH = frameH
  if (cardAspect > frameAspect) visW = frameH * cardAspect
  else visH = frameW / cardAspect
  const minX = FRAME_BOX.x + (frameW - visW) / 2
  const minY = FRAME_BOX.y + (frameH - visH) / 2
  const viewBox = `${FRAME_BOX.x} ${FRAME_BOX.y} ${frameW} ${frameH}`

  // Ambil titik-titik jalan yang masuk bingkai, lalu sebar 4 chip di atasnya.
  const candidates = parseRoadPoints(cityRoads.secondary ?? cityRoads.primary ?? '')
    .filter(
      ([x, y]) =>
        x > minX + visW * 0.12 &&
        x < minX + visW * 0.88 &&
        y > minY + visH * 0.12 &&
        y < minY + visH * 0.56,
    )
    .sort((a, b) => a[0] - b[0])

  // Buang titik yang terlalu berdekatan supaya chip tidak menumpuk.
  const spread = []
  for (const point of candidates) {
    if (spread.every((other) => Math.hypot(other[0] - point[0], other[1] - point[1]) > visW * 0.18)) {
      spread.push(point)
    }
  }

  const picked = fleet.map((car, index) => {
    const point =
      spread[Math.floor(((index + 0.5) / fleet.length) * spread.length)] ??
      (index === 0
        ? [minX + visW / 2, minY + visH / 2]
        : [minX + visW / 2 + (index - 1.5) * visW * 0.18, minY + visH / 2 - visH * 0.1])
    return {
      ...car,
      left: `${(((point[0] - minX) / visW) * 100).toFixed(2)}%`,
      top: `${(((point[1] - minY) / visH) * 100).toFixed(2)}%`,
    }
  })

  return (
    <section className="map-card" ref={card} aria-label="Peta armada travel di sekitar Semarang">
      <svg
        ref={svgRef}
        className="map-canvas"
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        <rect x={FRAME.cx - 20} y={FRAME.cy - 20} width="60" height="60" fill="#fbf3e6" />
        <path d={cityWater.sea} fill="#dfeaf0" />
        <path d={cityWater.lakes} fill="#bcdae7" />
        <path d={cityWater.rivers} className="r-river" />

        {roadClasses.map((cls) => (
          <path key={`c-${cls}`} d={cityRoads[cls] ?? ''} className={`r-casing r-${cls}`} />
        ))}
        {roadClasses.map((cls) => (
          <path key={cls} d={cityRoads[cls] ?? ''} className={`r-fill r-${cls}`} />
        ))}

        <path d={cityRoads.motorway ?? ''} className="r-route" />
      </svg>

      <div className="map-top">
        <span className="map-chip">
          <PinIcon width={14} height={14} />
          Semarang
        </span>
        <span
          className={`map-chip is-weather weather-${weather?.type ?? 'sun'}`}
          aria-label={`Cuaca Semarang: ${weather?.label ?? 'Cerah'} ${weather?.temp ?? 30} derajat`}
        >
          <WeatherIcon type={weather?.type ?? 'sun'} width={14} height={14} />
          {weather?.label ?? 'Cerah'} · {weather?.temp ?? 30}°
        </span>
      </div>

      {picked.map((car) => (
        <span
          className="map-car"
          key={car.id}
          style={{ top: car.top, left: car.left, animationDelay: car.delay }}
          aria-hidden="true"
        >
          <span className="map-car-icon">
            <FleetIcon fleet={car.label} width={12} height={12} />
          </span>
          {car.label}
        </span>
      ))}

      <span className="map-user">
        <i aria-hidden="true" />
        Kamu
      </span>

      <div className="map-bottom">
        <div>
          <strong>Jemput di titik terdekat</strong>
          <small>Armada berangkat tiap hari dari Semarang</small>
        </div>
        <button type="button" className="map-cta" onClick={expandThenGo}>
          Pesan
          <ArrowRightIcon width={14} height={14} />
        </button>
      </div>
    </section>
  )
}
