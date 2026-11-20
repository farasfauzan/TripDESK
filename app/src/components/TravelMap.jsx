import { Link } from 'react-router-dom'
import { cityRoads, cityWater } from '../osmSemarang.js'
import { ArrowRightIcon, FleetIcon, PinIcon, WeatherIcon } from './Icons.jsx'

// Bingkai peta Beranda: jalanan Kota Semarang dalam km (data OpenStreetMap),
// dipusatkan di sekitar Simpang Lima–Kota Lama.
const FRAME = { cx: 0.6, cy: 1.2, w: 5 }
const FRAME_H = FRAME.w / 1.88
const VIEWBOX = `${FRAME.cx - FRAME.w / 2} ${FRAME.cy - FRAME_H / 2} ${FRAME.w} ${FRAME_H}`
const roadClasses = ['motorway', 'trunk', 'primary', 'secondary', 'tertiary']

const cars = [
  { id: 'car-1', label: 'Hiace', top: '26%', left: '20%', delay: '0s' },
  { id: 'car-2', label: 'Elf', top: '44%', left: '66%', delay: '1.2s' },
  { id: 'car-3', label: 'Staria', top: '44%', left: '18%', delay: '2.1s' },
  { id: 'car-4', label: 'Hiace', top: '20%', left: '70%', delay: '0.6s' },
]

export default function TravelMap({ weather, ctaTo = '/cari' }) {
  return (
    <section className="map-card" aria-label="Peta armada travel di sekitar Semarang">
      <svg
        className="map-canvas"
        viewBox={VIEWBOX}
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

      {cars.map((car) => (
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
        <Link className="map-cta" to={ctaTo}>
          Pesan
          <ArrowRightIcon width={14} height={14} />
        </Link>
      </div>
    </section>
  )
}
