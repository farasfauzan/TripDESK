import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { createBooking, getProfile, getSchedule } from '../shared/api.js'
import { dateLong, rupiah, todayIso } from '../shared/utils.js'
import { ErrorBox, Loading } from '../shared/State.jsx'
import { CheckIcon, ChevronLeftIcon, PinIcon, TicketIcon } from '../shared/Icons.jsx'

const MAX_SEATS = 6

export default function Checkout() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const date = params.get('date') ?? todayIso()
  const preselectedPickup = params.get('pickup') ?? ''

  const [schedule, setSchedule] = useState(null)
  const [seats, setSeats] = useState([])
  const [form, setForm] = useState({ name: '', phone: '', email: '' })
  const [pickupPointId, setPickupPointId] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const controller = new AbortController()

    Promise.all([getSchedule(id, date, controller.signal), getProfile(controller.signal)])
      .then(([detail, profile]) => {
        setSchedule(detail)
        setPickupPointId(
          (current) =>
            current ||
            (detail.pickupPoints.some((point) => point.id === preselectedPickup)
              ? preselectedPickup
              : null) ||
            detail.pickupPoints[0]?.id ||
            '',
        )
        setForm((current) => ({
          name: current.name || profile.name,
          phone: current.phone || profile.phone,
          email: current.email || profile.email,
        }))
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })

    return () => controller.abort()
  }, [id, date, preselectedPickup])

  const toggleSeat = (seat) => {
    if (seat.taken) return
    setSeats((current) => {
      if (current.includes(seat.no)) return current.filter((no) => no !== seat.no)
      if (current.length >= MAX_SEATS) return current
      return [...current, seat.no]
    })
  }

  const total = (schedule?.price ?? 0) * seats.length
  const pickup = schedule?.pickupPoints.find((point) => point.id === pickupPointId) ?? null

  const submit = async (event) => {
    event.preventDefault()
    setError('')
    if (!seats.length) {
      setError('Pilih minimal satu kursi dulu ya.')
      return
    }
    setSubmitting(true)
    try {
      const booking = await createBooking({
        scheduleId: id,
        date,
        seats,
        passenger: form,
        pickupPointId,
      })
      navigate(`/pesanan/${booking.code}`, { replace: true, state: { justBooked: true } })
    } catch (err) {
      setError(err.message)
      setSubmitting(false)
    }
  }

  return (
    <div className="page">
      <div className="detail-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Kembali">
          <ChevronLeftIcon />
        </button>
        <h1>Pemesanan</h1>
        <span className="icon-btn is-ghost" aria-hidden="true" />
      </div>

      {error ? <ErrorBox message={error} /> : null}
      {!schedule ? (
        !error ? <Loading /> : null
      ) : (
        <form className="checkout" onSubmit={submit}>
          <article className="mini-trip">
            <div>
              <strong>
                {schedule.origin} → {schedule.destination}
              </strong>
              <small>
                {dateLong(date)} · {schedule.departTime}–{schedule.arriveTime}
              </small>
            </div>
            <span className="chip chip-soft">{schedule.fleet.type}</span>
          </article>

          <section className="section">
            <div className="section-head">
              <h2>Pilih kursi</h2>
              <span className="muted-small">Maks. {MAX_SEATS} kursi</span>
            </div>

            <div className="seat-map" role="group" aria-label="Pilih nomor kursi">
              {schedule.seats.map((seat) => {
                const selected = seats.includes(seat.no)
                return (
                  <button
                    type="button"
                    key={seat.no}
                    className={`seat${seat.taken ? ' is-taken' : ''}${selected ? ' is-selected' : ''}`}
                    onClick={() => toggleSeat(seat)}
                    disabled={seat.taken}
                    aria-pressed={selected}
                    aria-label={`Kursi ${seat.no}${seat.taken ? ' sudah dipesan' : selected ? ' dipilih' : ''}`}
                  >
                    {seat.no}
                  </button>
                )
              })}
            </div>

            <div className="legend">
              <span>
                <i className="dot" /> Tersedia
              </span>
              <span>
                <i className="dot is-selected" /> Dipilih
              </span>
              <span>
                <i className="dot is-taken" /> Terisi
              </span>
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Jadwal penjemputan</h2>
              <span className="muted-small">Berangkat {schedule.departTime}</span>
            </div>
            <p className="field-hint pickup-hint">
              <PinIcon width={14} height={14} />
              Pilih jam dan titik jemput. Datang 10 menit sebelum jam jemput.
            </p>
            <div className="pickup-list" role="radiogroup" aria-label="Jadwal penjemputan">
              {schedule.pickupPoints.map((point) => {
                const active = pickupPointId === point.id
                return (
                  <label key={point.id} className={`pickup-option${active ? ' is-active' : ''}`}>
                    <input
                      type="radio"
                      name="pickupPoint"
                      value={point.id}
                      checked={active}
                      onChange={() => setPickupPointId(point.id)}
                    />
                    <span className="pickup-time">{point.pickupTime}</span>
                    <span className="pickup-text">
                      <strong>{point.name}</strong>
                      <small>Titik jemput</small>
                    </span>
                    <span className="pickup-tick" aria-hidden="true">
                      <CheckIcon width={16} height={16} />
                    </span>
                  </label>
                )
              })}
            </div>
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Data penumpang</h2>
            </div>
            <div className="form-grid">
              <label className="field">
                <span>Nama lengkap</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="Nama sesuai identitas"
                  required
                />
              </label>
              <label className="field">
                <span>Nomor HP</span>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => setForm((prev) => ({ ...prev, phone: event.target.value }))}
                  placeholder="08xxxxxxxxxx"
                  required
                />
              </label>
              <label className="field">
                <span>Email (opsional)</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => setForm((prev) => ({ ...prev, email: event.target.value }))}
                  placeholder="nama@email.com"
                />
              </label>
            </div>
          </section>

          <section className="summary">
            <h2>Ringkasan</h2>
            <div className="summary-row">
              <span>Kursi dipilih</span>
              <strong>{seats.length ? [...seats].sort((a, b) => a - b).join(', ') : '—'}</strong>
            </div>
            <div className="summary-row">
              <span>Penjemputan</span>
              <strong>{pickup ? `${pickup.pickupTime} · ${pickup.name}` : '—'}</strong>
            </div>
            <div className="summary-row">
              <span>
                Harga {seats.length || 0} × {rupiah(schedule.price)}
              </span>
              <strong>{rupiah(total)}</strong>
            </div>
            <div className="summary-row is-total">
              <span>Total bayar</span>
              <strong>{rupiah(total)}</strong>
            </div>
          </section>

          <button type="submit" className="btn btn-primary btn-block" disabled={submitting || !schedule.seatsLeft}>
            <TicketIcon width={18} height={18} />
            {submitting ? 'Memproses pesanan…' : seats.length ? `Pesan ${seats.length} kursi · ${rupiah(total)}` : 'Pilih kursi dulu'}
          </button>
          <p className="fine-print">Pembayaran di demo ini belum terhubung ke payment gateway.</p>
        </form>
      )}
    </div>
  )
}
