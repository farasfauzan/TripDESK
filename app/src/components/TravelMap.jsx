import { useEffect, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { cityFrameKm } from '../semarangMapData.js'
import { gsap } from '../animations.js'
import { cityRoads, cityWater } from '../osmSemarang.js'
import { ArrowRightIcon, FleetIcon, PinIcon, WeatherIcon } from './Icons.jsx'

// Bingkai peta Beranda: jalanan Kota Semarang dalam km (data OpenStreetMap),
// dipusatkan di sekitar Simpang Lima–Kota Lama. Skala km/px dijaga tetap, jadi
// saat kartu melebar peta menampilkan area lebih luas — bukan di-crop.
const FRAME = { cx: 0.6, cy: 1.2 }
const KM_PER_PX = 5 / 424
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
  const navigate = useNavigate()
  const [size, setSize] = useState({ w: 424, h: 226 })

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

    // View Transitions: browser menahan snapshot peta lama (kartu Beranda)
    // sambil halaman /armada di-mount, lalu memorph-nya ke peta penuh.
    // Hasilnya tanpa jeda mount sama sekali.
    if (typeof document.startViewTransition === 'function' && !reduced) {
      document.startViewTransition(() => {
        flushSync(() => navigate(ctaTo, { state: { fromMapExpand: true } }))
      })
      return
    }

    // Fallback: kartu melebar di tempat (transform, composited).
    const element = card.current
    const svg = svgRef.current
    const from = element.getBoundingClientRect()
    const shell = element.closest('.app-shell')
    const shellRect = shell ? shell.getBoundingClientRect() : from
    const target = { x: shellRect.x, y: shellRect.y, w: shellRect.width, h: 370 }

    const cam = { x: minX, y: minY, w: frameW, h: frameH }
    const end = cityFrameKm('SMG-1')

    let lastApply = 0
    const apply = () => {
      const now = performance.now()
      if (now - lastApply < 16) return
      lastApply = now
      if (svg) svg.setAttribute('viewBox', `${cam.x} ${cam.y} ${cam.w} ${cam.h}`)
    }

    if (reduced) {
      navigate(ctaTo, { state: { fromMapExpand: true } })
      return
    }

    Object.assign(element.style, {
      position: 'fixed',
      left: `${target.x}px`,
      top: `${target.y}px`,
      width: `${target.w}px`,
      height: `${target.h}px`,
      margin: '0',
      zIndex: '60',
      transformOrigin: '0 0',
    })
    element.classList.add('is-expanding')
    gsap.set(element, {
      x: from.x - target.x,
      y: from.y - target.y,
      scaleX: from.width / target.w,
      scaleY: from.height / target.h,
    })

    gsap
      .timeline({
        defaults: { ease: 'power2.out' },
        onComplete: () => navigate(ctaTo, { state: { fromMapExpand: true } }),
      })
      .to(element, { x: 0, y: 0, scaleX: 1, scaleY: 1, borderRadius: 0, duration: 0.66 }, 0)
      .to(cam, { ...end, duration: 0.66, onUpdate: apply }, 0)
      .to('.map-chip, .map-car, .map-user, .map-bottom', { autoAlpha: 0, duration: 0.2 }, 0)
  }

  const frameW = size.w * KM_PER_PX
  const frameH = size.h * KM_PER_PX
  const minX = FRAME.cx - frameW / 2
  const minY = FRAME.cy - frameH / 2
  const viewBox = `${minX} ${minY} ${frameW} ${frameH}`

  // Ambil titik-titik jalan yang masuk bingkai, lalu sebar 4 chip di atasnya.
  const candidates = parseRoadPoints(cityRoads.secondary ?? cityRoads.primary ?? '')
    .filter(
      ([x, y]) =>
        x > minX + frameW * 0.12 &&
        x < minX + frameW * 0.88 &&
        y > minY + frameH * 0.18 &&
        y < minY + frameH * 0.72,
    )
    .sort((a, b) => a[0] - b[0])

  // Buang titik yang terlalu berdekatan supaya chip tidak menumpuk.
  const spread = []
  for (const point of candidates) {
    if (spread.every((other) => Math.hypot(other[0] - point[0], other[1] - point[1]) > frameW * 0.18)) {
      spread.push(point)
    }
  }

  const picked = fleet.map((car, index) => {
    const point =
      spread[Math.floor(((index + 0.5) / fleet.length) * spread.length)] ??
      (index === 0 ? [FRAME.cx, FRAME.cy] : [FRAME.cx + (index - 1.5) * 0.9, FRAME.cy - 0.35])
    return {
      ...car,
      left: `${(((point[0] - minX) / frameW) * 100).toFixed(2)}%`,
      top: `${(((point[1] - minY) / frameH) * 100).toFixed(2)}%`,
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
