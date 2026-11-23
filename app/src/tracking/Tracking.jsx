import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getBooking } from '../shared/api.js'
import { dateLong } from '../shared/utils.js'
import { buildTrackingSteps, buildTrackingView } from './trackingView.js'
import { gsap, useGSAP } from '../shared/animations.js'
import TrackingMap from './TrackingMap.jsx'
import { ErrorBox, Loading } from '../shared/State.jsx'
import { ArrowRightIcon, CheckIcon, ChevronLeftIcon, ClockIcon, TicketIcon } from '../shared/Icons.jsx'

export default function Tracking() {
  const { code } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const at = params.get('at') ?? ''
  const scope = useRef(null)

  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')
  const [clock, setClock] = useState(() => new Date())

  useEffect(() => {
    const controller = new AbortController()
    getBooking(code, controller.signal)
      .then(setBooking)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
    return () => controller.abort()
  }, [code])

  useEffect(() => {
    const timer = setInterval(() => setClock(new Date()), 30000)
    return () => clearInterval(timer)
  }, [])

  // `?at=HH:MM` hanya untuk demo/uji status tanpa menunggu jam asli.
  const now = useMemo(() => {
    if (!booking || !/^\d{2}:\d{2}$/.test(at)) return clock
    const simulated = new Date(`${booking.date}T${at}:00`)
    return Number.isNaN(simulated.getTime()) ? clock : simulated
  }, [booking, at, clock])

  const view = useMemo(() => (booking ? buildTrackingView(booking, now) : null), [booking, now])
  const steps = useMemo(() => (booking ? buildTrackingSteps(booking, now) : []), [booking, now])

  useGSAP(
    () => {
      if (!view) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from('.track-headline', { y: 10, opacity: 0, duration: 0.4, ease: 'power2.out' })
        gsap.from('.timeline-step', {
          x: -10,
          opacity: 0,
          duration: 0.35,
          ease: 'power2.out',
          stagger: 0.05,
        })
      })
      return () => mm.revert()
    },
    { scope, dependencies: [view?.completed] },
  )

  return (
    <div className="page tracking" ref={scope}>
      <div className="detail-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Kembali">
          <ChevronLeftIcon />
        </button>
        <h1>Lacak armada</h1>
        <span className="icon-btn is-ghost" aria-hidden="true" />
      </div>

      <ErrorBox message={error} />
      {!booking && !error ? <Loading label="Menghubungkan ke armada…" /> : null}

      {booking && view ? (
        <>
          <TrackingMap
            label={view.chip}
            live={view.live}
            active={view.live}
            pointName={booking.pickupPoint.name}
            pickupId={booking.pickupPoint.id}
          />

          <div className="track-headline">
            <div>
              <small>{booking.code}</small>
              <strong>{view.headline}</strong>
              <p>{view.caption}</p>
            </div>
            <span className={`chip ${booking.status === 'dibatalkan' ? 'chip-muted' : 'chip-ok'}`}>
              {booking.origin} <ArrowRightIcon width={12} height={12} /> {booking.destination}
            </span>
          </div>

          <div className="track-meta">
            <div>
              <small>Armada</small>
              <strong>{booking.fleet}</strong>
            </div>
            <div>
              <small>Kursi</small>
              <strong>{booking.seats.join(', ')}</strong>
            </div>
            <div>
              <small>Jemput</small>
              <strong>{booking.pickupPoint.time ?? booking.departTime}</strong>
            </div>
          </div>

          <ol className="timeline">
            {steps.map((step, index) => {
              const state =
                index < view.completed ? 'is-done' : index === view.completed ? 'is-active' : 'is-pending'
              return (
                <li key={step.key} className={`timeline-step ${state}`}>
                  <span className="timeline-dot">
                    {state === 'is-done' ? <CheckIcon width={13} height={13} /> : <i />}
                  </span>
                  <div className="timeline-body">
                    <strong>{step.title}</strong>
                    <small>{step.detail}</small>
                  </div>
                  <span className="timeline-time">{step.time}</span>
                </li>
              )
            })}
          </ol>

          <div className="note-card is-muted">
            <ClockIcon width={20} height={20} />
            <p>
              ETA bersifat estimasi demo dan bukan pelacakan GPS. Posisi armada diperbarui saat status
              penjemputan berubah.
            </p>
          </div>

          <div className="track-actions">
            <Link className="btn btn-primary" to={`/pesanan/${booking.code}`}>
              <TicketIcon width={16} height={16} />
              Lihat e-tiket
            </Link>
            <span className="muted-small">{dateLong(booking.date)}</span>
          </div>

          {at ? <p className="fine-print">Mode uji status: {at}</p> : null}
        </>
      ) : null}
    </div>
  )
}
