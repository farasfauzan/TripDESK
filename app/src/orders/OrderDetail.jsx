import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { cancelBooking, deleteBooking, getBooking } from '../shared/api.js'
import { dateLong, rupiah } from '../shared/utils.js'
import StatusPill from './StatusPill.jsx'
import ConfirmDialog from '../shared/ConfirmDialog.jsx'
import { ErrorBox, Loading } from '../shared/State.jsx'
import { downloadTicket } from './ticketImage.js'
import {
  CheckIcon,
  ChevronLeftIcon,
  ClockIcon,
  CopyIcon,
  DownloadIcon,
  PinIcon,
  TrashIcon,
  UserIcon,
} from '../shared/Icons.jsx'

export default function OrderDetail() {
  const { code } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const [booking, setBooking] = useState(null)
  const [error, setError] = useState('')
  const [flash, setFlash] = useState(Boolean(state?.justBooked))
  const [notice, setNotice] = useState('')
  const [copied, setCopied] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirm, setConfirm] = useState(null)

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
    if (!flash) return undefined
    const timer = setTimeout(() => setFlash(false), 6000)
    return () => clearTimeout(timer)
  }, [flash])

  useEffect(() => {
    if (!notice) return undefined
    const timer = setTimeout(() => setNotice(''), 6000)
    return () => clearTimeout(timer)
  }, [notice])

  const bars = useMemo(() => {
    if (!booking) return []
    return Array.from({ length: 42 }, (_, index) => {
      const charCode = booking.code.charCodeAt(index % booking.code.length)
      return 1 + ((charCode + index * 5) % 3)
    })
  }, [booking])

  const copyCode = async () => {
    if (!booking) return
    try {
      await navigator.clipboard.writeText(booking.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      setError('Browser tidak mengizinkan akses clipboard.')
    }
  }

  const saveTicket = async () => {
    if (!booking || downloading) return
    setDownloading(true)
    setError('')
    setNotice('')
    try {
      const filename = await downloadTicket(booking)
      setNotice(`Tiket tersimpan sebagai ${filename}.`)
    } catch (err) {
      setError(err.message || 'Tiket gagal diunduh. Coba lagi.')
    } finally {
      setDownloading(false)
    }
  }

  const cancel = async () => {
    if (!booking) return
    setConfirm(null)
    setCancelling(true)
    setError('')
    try {
      const updated = await cancelBooking(booking.code)
      setBooking(updated)
    } catch (err) {
      setError(err.message)
    } finally {
      setCancelling(false)
    }
  }

  const removeFromHistory = async () => {
    if (!booking) return
    setConfirm(null)
    setDeleting(true)
    setError('')
    try {
      await deleteBooking(booking.code)
      navigate('/pesanan', {
        replace: true,
        state: { flash: `Pesanan ${booking.code} dihapus dari riwayat.` },
      })
    } catch (err) {
      setError(err.message)
      setDeleting(false)
    }
  }

  return (
    <div className="page detail">
      <div className="detail-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Kembali">
          <ChevronLeftIcon />
        </button>
        <h1>Detail pesanan</h1>
        <span className="icon-btn is-ghost" aria-hidden="true" />
      </div>

      {flash ? (
        <div className="toast toast-ok" role="status">
          <CheckIcon width={18} height={18} />
          Pesanan berhasil dibuat. Tunjukkan e-tiket ini saat naik armada.
        </div>
      ) : null}

      {notice ? (
        <div className="toast toast-ok" role="status">
          <CheckIcon width={18} height={18} />
          <span>{notice}</span>
          <button type="button" className="toast-close" onClick={() => setNotice('')} aria-label="Tutup notifikasi">
            ×
          </button>
        </div>
      ) : null}

      <ConfirmDialog
        open={!!confirm}
        title={confirm === 'cancel' ? 'Batalkan pesanan?' : 'Hapus dari riwayat?'}
        description={
          confirm === 'cancel'
            ? `Pesanan ${booking?.code ?? ''} akan dibatalkan dan kursinya dilepas kembali.`
            : `Pesanan ${booking?.code ?? ''} akan dihapus permanen dari riwayat.`
        }
        confirmLabel={confirm === 'cancel' ? 'Batalkan pesanan' : 'Hapus'}
        busy={cancelling || deleting}
        onConfirm={confirm === 'cancel' ? cancel : removeFromHistory}
        onCancel={() => setConfirm(null)}
      />

      <ErrorBox message={error} />
      {!booking && !error ? <Loading label="Memuat e-tiket…" /> : null}

      {booking ? (
        <>
          <article className="eticket">
            <div className="eticket-head">
              <div>
                <small>Kode booking</small>
                <strong>{booking.code}</strong>
              </div>
              <StatusPill status={booking.status} />
            </div>

            <div className="eticket-route">
              <div>
                <strong>{booking.departTime}</strong>
                <span>{booking.origin}</span>
              </div>
              <div className="eticket-line">
                <span className="line" />
                <small>{dateLong(booking.date)}</small>
              </div>
              <div className="is-right">
                <strong>{booking.arriveTime}</strong>
                <span>{booking.destination}</span>
              </div>
            </div>

            <div className="eticket-divider" aria-hidden="true" />

            <dl className="eticket-grid">
              <div>
                <dt>Tanggal</dt>
                <dd>{dateLong(booking.date)}</dd>
              </div>
              <div>
                <dt>Kursi</dt>
                <dd>{booking.seats.join(', ')}</dd>
              </div>
              <div>
                <dt>Penumpang</dt>
                <dd>{booking.passenger.name}</dd>
              </div>
              <div>
                <dt>Armada</dt>
                <dd>{booking.fleet}</dd>
              </div>
              <div>
                <dt>Titik jemput</dt>
                <dd>
                  {booking.pickupPoint.time
                    ? `${booking.pickupPoint.time} · ${booking.pickupPoint.name}`
                    : booking.pickupPoint.name}
                </dd>
              </div>
              <div>
                <dt>Total bayar</dt>
                <dd className="strong">{rupiah(booking.total)}</dd>
              </div>
            </dl>

            <div className="barcode" aria-hidden="true">
              {bars.map((width, index) => (
                <span key={index} style={{ width: `${width}px` }} />
              ))}
            </div>
            <p className="barcode-text">{booking.code}</p>
          </article>

          {booking.status === 'terjadwal' ? (
            <Link className="btn btn-primary btn-block track-link" to={`/lacak/${booking.code}`}>
              <PinIcon width={16} height={16} />
              Lacak armada
            </Link>
          ) : null}

          <button
            type="button"
            className="btn btn-soft btn-block ticket-download"
            onClick={saveTicket}
            disabled={downloading}
          >
            <DownloadIcon width={17} height={17} />
            {downloading ? 'Menyiapkan tiket…' : 'Unduh tiket'}
          </button>

          <div className="eticket-actions">
            <button type="button" className="btn btn-ghost" onClick={copyCode}>
              {copied ? <CheckIcon width={16} height={16} /> : <CopyIcon width={16} height={16} />}
              {copied ? 'Kode disalin' : 'Salin kode'}
            </button>
            {booking.status === 'terjadwal' ? (
              <button type="button" className="btn btn-danger-ghost" onClick={() => setConfirm('cancel')} disabled={cancelling}>
                {cancelling ? 'Membatalkan…' : 'Batalkan pesanan'}
              </button>
            ) : null}
            {booking.status === 'selesai' || booking.status === 'dibatalkan' ? (
              <button type="button" className="btn btn-ghost" onClick={() => setConfirm('delete')} disabled={deleting}>
                <TrashIcon width={15} height={15} />
                {deleting ? 'Menghapus…' : 'Hapus dari riwayat'}
              </button>
            ) : null}
          </div>

          <div className="note-card">
            <ClockIcon width={20} height={20} />
            <p>
              {booking.pickupPoint.time
                ? `Jemput ${booking.pickupPoint.time} di ${booking.pickupPoint.name}. Datang 10 menit sebelum jam jemput.`
                : `Datang 15 menit sebelum keberangkatan di ${booking.pickupPoint.name}.`}{' '}
              E-tiket ini berlaku sebagai bukti pemesanan.
            </p>
          </div>

          <div className="note-card is-muted">
            <UserIcon width={20} height={20} />
            <p>Butuh ubah jadwal? Hubungi admin travel. Perubahan kursi belum tersedia di demo ini.</p>
          </div>

          <div className="note-card is-muted">
            <PinIcon width={20} height={20} />
            <p>
              Rute {booking.origin} → {booking.destination} · kode jadwal {booking.scheduleCode}
            </p>
          </div>
        </>
      ) : null}
    </div>
  )
}
