import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBookings, getLocations, getProfile, getRoutes, getSchedules } from '../api.js'
import { dateLong, dateShort, rupiah, todayIso } from '../utils.js'
import { captureMapMorphFromDom } from '../mapTransition.js'
import { weatherFor } from '../weather.js'
import ScheduleCard from '../components/ScheduleCard.jsx'
import TravelMap from '../components/TravelMap.jsx'
import { gsap, useGSAP, useReveal } from '../animations.js'
import { EmptyState, ErrorBox, Loading } from '../components/State.jsx'
import {
  ArrowRightIcon,
  BusIcon,
  CalendarIcon,
  ChevronRightIcon,
  InfoIcon,
  TicketIcon,
  UserIcon,
} from '../components/Icons.jsx'

const services = [
  { to: '/armada', label: 'Pesan travel', icon: BusIcon },
  { to: '/cari', label: 'Cek jadwal', icon: CalendarIcon },
  { to: '/pesanan', label: 'Tiket saya', icon: TicketIcon },
  { to: '/tentang', label: 'Tentang', icon: InfoIcon },
  { to: '/profil', label: 'Akun', icon: UserIcon },
]

export default function Home() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const scope = useReveal([Boolean(data)])

  useEffect(() => {
    const controller = new AbortController()
    const date = todayIso()
    Promise.all([
      getLocations(controller.signal),
      getRoutes({ origin: 'SMG', date }, controller.signal),
      getSchedules({ origin: 'SMG', date }, controller.signal),
      getProfile(controller.signal),
      getBookings({ status: 'terjadwal' }, controller.signal),
    ])
      .then(([locations, routes, schedules, profile, bookings]) => {
        setData({ locations, routes: routes.slice(0, 4), schedules, profile, bookings, date })
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
    return () => controller.abort()
  }, [])

  const firstName = data?.profile?.name?.split(' ')[0] ?? 'Faras'

  const nextTicket = useMemo(() => {
    const today = todayIso()
    return (
      [...(data?.bookings ?? [])]
        .filter((booking) => booking.date >= today)
        .sort((a, b) => `${a.date}${a.departTime}`.localeCompare(`${b.date}${b.departTime}`))[0] ?? null
    )
  }, [data])

  useGSAP(
    () => {
      if (!data) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.route-row', {
          y: 14,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.out',
          stagger: 0.06,
          scrollTrigger: { trigger: '.route-list', start: 'top 90%', once: true },
        })
        gsap.from('.schedule-card', {
          y: 14,
          opacity: 0,
          duration: 0.4,
          ease: 'power2.out',
          stagger: 0.06,
          scrollTrigger: { trigger: '.schedule-list', start: 'top 92%', once: true },
        })
      })
      return () => mm.revert()
    },
    { scope, dependencies: [data] },
  )

  return (
    <div className="page home" ref={scope}>
      <header className="gojek-top">
        <span className="location-pill">
          <span className="location-dot" aria-hidden="true" />
          Semarang
        </span>
        <Link to="/profil" className="avatar" aria-label="Buka profil">
          {data?.profile?.name
            ? data.profile.name
                .split(' ')
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
            : 'FF'}
        </Link>
      </header>

      <div className="home-greeting">
        <h1>Mau ke mana, <span className="accent-name">{firstName}</span>?</h1>
        <p>Travel antarkota siap jemput dari titik terdekat.</p>
      </div>

      <TravelMap weather={weatherFor(data?.date)} ctaTo="/armada" />

      <section className="service-card" aria-label="Layanan Tripdesk">
        <div className="service-grid">
          {services.map((service) => {
            const Icon = service.icon
            return (
              <Link
                className="service-item"
                to={service.to}
                key={service.label}
                onClick={() => {
                  if (service.to === '/armada') captureMapMorphFromDom()
                }}
              >
                <span className="service-icon">
                  <Icon width={20} height={20} />
                </span>
                <span>{service.label}</span>
              </Link>
            )
          })}
        </div>
      </section>

      {nextTicket ? (
        <Link className="next-ticket" data-reveal to={`/pesanan/${nextTicket.code}`}>
          <span className="next-badge">Tiket berikutnya</span>
          <div className="next-body">
            <div>
              <strong>
                {nextTicket.origin}
                <ArrowRightIcon width={13} height={13} />
                {nextTicket.destination}
              </strong>
              <small>
                {dateShort(nextTicket.date)} · {nextTicket.departTime}
                {nextTicket.pickupPoint?.time ? ` · jemput ${nextTicket.pickupPoint.time}` : ''}
              </small>
            </div>
            <ChevronRightIcon width={18} height={18} />
          </div>
        </Link>
      ) : null}

      <ErrorBox message={error} />
      {!data && !error ? <Loading /> : null}

      {data ? (
        <>
          <section className="section">
            <div className="section-head">
              <h2>Rute favorit</h2>
              <Link to="/cari" className="link-more">
                Semua rute <ChevronRightIcon width={16} height={16} />
              </Link>
            </div>
            <div className="route-list">
              {data.routes.map((route) => (
                <Link
                  className="route-row"
                  key={route.id}
                  to={`/cari?origin=${route.originId}&destination=${route.destinationId}&date=${data.date}`}
                >
                  <span className="route-badge">
                    <BusIcon />
                  </span>
                  <span className="route-text">
                    <strong>
                      {route.origin}
                      <ArrowRightIcon width={13} height={13} />
                      {route.destination}
                    </strong>
                    <small>
                      {route.scheduleCount} jadwal · mulai {rupiah(route.cheapestPrice)}
                    </small>
                  </span>
                  <ChevronRightIcon width={18} height={18} />
                </Link>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Berangkat hari ini</h2>
              <span className="muted-small">{dateLong(data.date)}</span>
            </div>
            {data.schedules.length ? (
              <div className="schedule-list">
                {data.schedules.slice(0, 3).map((schedule) => (
                  <ScheduleCard key={schedule.id} schedule={schedule} date={data.date} />
                ))}
              </div>
            ) : (
              <EmptyState title="Belum ada jadwal" description="Coba pilih rute lain untuk hari ini." />
            )}
          </section>
        </>
      ) : null}
    </div>
  )
}
