import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getBookings } from '../shared/api.js'
import { dateShort, rupiah } from '../shared/utils.js'
import StatusPill from './StatusPill.jsx'
import { EmptyState, ErrorBox, Loading } from '../shared/State.jsx'
import { ArrowRightIcon, TicketIcon } from '../shared/Icons.jsx'

const filters = [
  { id: 'semua', label: 'Semua' },
  { id: 'terjadwal', label: 'Terjadwal' },
  { id: 'berlangsung', label: 'Berlangsung' },
  { id: 'selesai', label: 'Selesai' },
  { id: 'dibatalkan', label: 'Dibatalkan' },
]

export default function Orders() {
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('semua')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getBookings({}, controller.signal)
      .then(setBookings)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [])

  const visible = filter === 'semua' ? bookings : bookings.filter((booking) => booking.status === filter)

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Pesanan saya</p>
          <h1>Tiket travel</h1>
        </div>
        <Link to="/cari" className="head-action">
          Pesan baru
        </Link>
      </header>

      <div className="filter-row" role="tablist" aria-label="Filter status pesanan">
        {filters.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={filter === item.id}
            className={`filter-pill${filter === item.id ? ' is-active' : ''}`}
            onClick={() => setFilter(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>

      <ErrorBox message={error} />

      {loading ? (
        <Loading label="Memuat pesanan…" />
      ) : visible.length ? (
        <div className="order-list">
          {visible.map((booking) => (
            <Link className="order-card" key={booking.code} to={`/pesanan/${booking.code}`}>
              <div className="order-top">
                <span className="chip chip-soft">{booking.code}</span>
                <StatusPill status={booking.status} />
              </div>
              <h3>
                {booking.origin}
                <ArrowRightIcon width={15} height={15} />
                {booking.destination}
              </h3>
              <p className="order-meta">
                {dateShort(booking.date)} · {booking.departTime}–{booking.arriveTime}
              </p>
              <div className="order-bottom">
                <span>
                  {booking.seats.length} kursi · kursi {booking.seats.join(', ')}
                </span>
                <strong>{rupiah(booking.total)}</strong>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        !error && (
          <EmptyState
            title={filter === 'semua' ? 'Belum ada pesanan' : 'Tidak ada pesanan di filter ini'}
            description={
              filter === 'semua'
                ? 'Yuk cari jadwal travel pertamamu dan pilih kursi favorit.'
                : 'Coba lihat semua pesanan untuk memastikan tidak ada yang terlewat.'
            }
            action={
              <Link className="btn btn-primary" to="/cari">
                <TicketIcon width={18} height={18} />
                Cari travel
              </Link>
            }
          />
        )
      )}
    </div>
  )
}
