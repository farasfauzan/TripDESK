import { Link } from 'react-router-dom'
import { FleetIcon, PinIcon } from './Icons.jsx'

const slots = [
  { top: '16%', left: '16%' },
  { top: '24%', left: '63%' },
  { top: '40%', left: '36%' },
  { top: '46%', left: '72%' },
  { top: '10%', left: '44%' },
  { top: '38%', left: '6%' },
]

export default function NearbyMap({ armada = [], date, pickupId = '', pickupName = 'titik jemput' }) {
  return (
    <section className="nearby-map" aria-label={`Armada di sekitar ${pickupName}`}>
      <svg viewBox="0 0 400 380" preserveAspectRatio="none" aria-hidden="true">
        <rect width="400" height="380" fill="#ece5d8" />
        <rect x="-10" y="-10" width="150" height="110" rx="10" fill="#e2d8c8" />
        <rect x="250" y="210" width="170" height="180" rx="12" fill="#e2d8c8" />
        <rect x="120" y="270" width="60" height="40" rx="4" fill="#d8cdbb" />
        <rect x="320" y="50" width="46" height="34" rx="4" fill="#d8cdbb" />
        <circle cx="332" cy="140" r="42" fill="#c9dce2" opacity="0.8" />
        <path d="M-20 300 C70 250 130 280 200 200 S320 120 422 150" stroke="#ffffff" strokeWidth="20" fill="none" />
        <path d="M-20 300 C70 250 130 280 200 200 S320 120 422 150" stroke="#c0492b" strokeWidth="3.5" strokeDasharray="10 9" fill="none" opacity="0.7" />
        <path d="M-10 120 C90 140 180 120 260 150 S360 170 410 160" stroke="#ffffff" strokeWidth="12" fill="none" />
        <path d="M96 -12 L128 392" stroke="#ffffff" strokeWidth="12" />
        <path d="M252 -12 L232 392" stroke="#ffffff" strokeWidth="8" />
        <path d="M-12 60 L412 84" stroke="#ffffff" strokeWidth="7" opacity="0.85" />
      </svg>

      <span className="user-radius" aria-hidden="true" />
      <span className="user-marker">
        <i aria-hidden="true" />
        <span>Lokasi kamu</span>
      </span>

      {armada.slice(0, 6).map((item, index) => (
        <Link
          className="nearby-car"
          key={item.id}
          style={slots[index]}
          to={`/jadwal/${item.id}?date=${date}${pickupId ? `&pickup=${pickupId}` : ''}`}
        >
          <span className="nearby-car-icon">
            <FleetIcon fleet={item.fleet} width={13} height={13} />
          </span>
          <span className="nearby-car-text">
            <strong>{item.pickupEtaMinutes} mnt</strong>
            <small>{item.seatsLeft} kursi</small>
          </span>
        </Link>
      ))}

      <span className="nearby-pickup">
        <PinIcon width={13} height={13} />
        {pickupName}
      </span>
    </section>
  )
}
