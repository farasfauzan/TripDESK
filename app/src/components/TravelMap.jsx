import { Link } from 'react-router-dom'
import { ArrowRightIcon, FleetIcon, PinIcon, WeatherIcon } from './Icons.jsx'

const cars = [
  { id: 'car-1', label: 'Hiace', top: '26%', left: '20%', delay: '0s' },
  { id: 'car-2', label: 'Elf', top: '44%', left: '66%', delay: '1.2s' },
  { id: 'car-3', label: 'Staria', top: '44%', left: '18%', delay: '2.1s' },
  { id: 'car-4', label: 'Hiace', top: '20%', left: '70%', delay: '0.6s' },
]

export default function TravelMap({ weather, ctaTo = '/cari' }) {
  return (
    <section className="map-card" aria-label="Peta armada travel di sekitar Semarang">
      <svg className="map-canvas" viewBox="0 0 400 220" preserveAspectRatio="none" aria-hidden="true">
        <rect width="400" height="220" fill="#ece5d8" />
        <rect x="-10" y="-10" width="150" height="86" rx="10" fill="#e2d8c8" />
        <rect x="248" y="126" width="164" height="110" rx="10" fill="#e2d8c8" />
        <rect x="120" y="182" width="54" height="30" rx="4" fill="#d8cdbb" />
        <rect x="296" y="22" width="44" height="30" rx="4" fill="#d8cdbb" />
        <circle cx="338" cy="74" r="34" fill="#c9dce2" opacity="0.85" />
        <path d="M-20 172 C70 138 112 154 182 104 S318 46 422 74" stroke="#ffffff" strokeWidth="17" fill="none" />
        <path
          d="M-20 172 C70 138 112 154 182 104 S318 46 422 74"
          stroke="#c0492b"
          strokeWidth="3.5"
          strokeDasharray="10 9"
          fill="none"
          opacity="0.75"
        />
        <path d="M58 -12 L88 232" stroke="#ffffff" strokeWidth="11" />
        <path d="M228 -12 L208 232" stroke="#ffffff" strokeWidth="8" />
        <path d="M-12 58 L412 84" stroke="#ffffff" strokeWidth="7" opacity="0.85" />
        <path d="M-10 120 L410 138" stroke="#ffffff" strokeWidth="4" opacity="0.7" />
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
