import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { getSchedule } from '../api.js'
import { dateLong, durationText, rupiah, todayIso } from '../utils.js'
import { ErrorBox, Loading } from '../components/State.jsx'
import {
  ArrowRightIcon,
  BusIcon,
  ChevronLeftIcon,
  ClockIcon,
  PinIcon,
  ShieldIcon,
} from '../components/Icons.jsx'

export default function ScheduleDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const date = params.get('date') ?? todayIso()
  const pickup = params.get('pickup') ?? ''

  const [schedule, setSchedule] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    setError('')
    getSchedule(id, date, controller.signal)
      .then(setSchedule)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
    return () => controller.abort()
  }, [id, date])

  return (
    <div className="page detail">
      <div className="detail-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Kembali">
          <ChevronLeftIcon />
        </button>
        <h1>Detail perjalanan</h1>
        <span className="icon-btn is-ghost" aria-hidden="true" />
      </div>

      {error ? <ErrorBox message={error} /> : null}
      {!schedule && !error ? <Loading /> : null}

      {schedule ? (
        <>
          <article className="ticket">
            <div className="ticket-top">
              <span className="chip chip-soft">{dateLong(date)}</span>
              <span className="chip chip-ok">{schedule.code}</span>
            </div>

            <div className="ticket-route">
              <div className="ticket-point">
                <strong>{schedule.departTime}</strong>
                <span>{schedule.origin}</span>
              </div>
              <div className="ticket-line">
                <span>{durationText(schedule.durationMinutes)}</span>
                <div className="line">
                  <BusIcon width={16} height={16} />
                </div>
                <span>{schedule.distanceKm} km</span>
              </div>
              <div className="ticket-point is-right">
                <strong>{schedule.arriveTime}</strong>
                <span>{schedule.destination}</span>
              </div>
            </div>

            <div className="ticket-grid">
              <div>
                <small>Armada</small>
                <strong>{schedule.fleet.model}</strong>
              </div>
              <div>
                <small>Nomor lambung</small>
                <strong>{schedule.fleet.plate}</strong>
              </div>
              <div>
                <small>Kelas</small>
                <strong>{schedule.fleet.type}</strong>
              </div>
              <div>
                <small>Sisa kursi</small>
                <strong className={schedule.seatsLeft <= 3 ? 'is-low' : ''}>{schedule.seatsLeft}</strong>
              </div>
            </div>
          </article>

          <section className="section">
            <div className="section-head">
              <h2>Fasilitas</h2>
            </div>
            <div className="chip-row">
              {schedule.amenities.map((item) => (
                <span className="chip" key={item}>
                  {item}
                </span>
              ))}
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Titik jemput · {schedule.origin}</h2>
            </div>
            <ul className="point-list">
              {schedule.pickupPoints.map((point) => (
                <li key={point.id} className={point.id === pickup ? 'is-active' : undefined}>
                  <PinIcon width={18} height={18} />
                  <span>{point.name}</span>
                  <span className="point-time">{point.pickupTime}</span>
                </li>
              ))}
            </ul>

            <div className="section-head">
              <h2>Titik turun · {schedule.destination}</h2>
            </div>
            <ul className="point-list">
              {schedule.dropPoints.map((point) => (
                <li key={point.id}>
                  <PinIcon width={18} height={18} />
                  <span>{point.name}</span>
                </li>
              ))}
            </ul>
          </section>

          <div className="note-card">
            <ShieldIcon width={20} height={20} />
            <p>
              Pilih jam jemput saat memesan. Datang 10 menit sebelum jam jemput, kursi tidak dapat
              dipindah setelah dipesan.
            </p>
          </div>

          <div className="note-card is-muted">
            <ClockIcon width={20} height={20} />
            <p>Perjalanan estimasi {durationText(schedule.durationMinutes)}, tergantung kondisi lalu lintas.</p>
          </div>

          <div className="action-bar">
            <div className="action-price">
              <small>Harga per kursi</small>
              <strong>{rupiah(schedule.price)}</strong>
            </div>
            {schedule.seatsLeft > 0 ? (
              <Link
                className="btn btn-primary"
                to={`/pesan/${schedule.id}?date=${date}${pickup ? `&pickup=${pickup}` : ''}`}
              >
                Pesan sekarang
                <ArrowRightIcon width={16} height={16} />
              </Link>
            ) : (
              <button type="button" className="btn btn-primary" disabled>
                Kursi habis
              </button>
            )}
          </div>
        </>
      ) : null}
    </div>
  )
}
