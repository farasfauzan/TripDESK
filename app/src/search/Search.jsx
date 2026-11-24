import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { getLocations, getPickupPoints, getSchedules } from '../shared/api.js'
import { dateLong, todayIso } from '../shared/utils.js'
import ScheduleCard from '../schedule/ScheduleCard.jsx'
import { EmptyState, ErrorBox, Loading } from '../shared/State.jsx'
import { CalendarIcon, SearchIcon, SwapIcon } from '../shared/Icons.jsx'

export default function Search() {
  const [params, setParams] = useSearchParams()
  const origin = params.get('origin') ?? 'SMG'
  const destination = params.get('destination') ?? 'JPR'
  const date = params.get('date') ?? todayIso()
  const pickup = params.get('pickup') ?? ''

  const [locations, setLocations] = useState([])
  const [pickupPoints, setPickupPoints] = useState([])
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ origin, destination, date, pickupPointId: pickup })

  useEffect(() => {
    setForm({ origin, destination, date, pickupPointId: pickup })
  }, [origin, destination, date, pickup])

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([getLocations(controller.signal), getPickupPoints(origin, controller.signal)])
      .then(([cities, points]) => {
        setLocations(cities)
        setPickupPoints(points)
        setForm((prev) => ({
          ...prev,
          pickupPointId: points.some((point) => point.id === prev.pickupPointId)
            ? prev.pickupPointId
            : (points[0]?.id ?? ''),
        }))
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
    return () => controller.abort()
  }, [origin])

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    getSchedules({ origin, destination, date, pickupPointId: pickup }, controller.signal)
      .then(setSchedules)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [origin, destination, date, pickup])

  useEffect(() => {
    if (!pickupPoints.length) return
    if (!pickup || !pickupPoints.some((point) => point.id === pickup)) {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          next.set('pickup', pickupPoints[0].id)
          return next
        },
        { replace: true },
      )
    }
  }, [pickup, pickupPoints, setParams])

  const cityName = useMemo(
    () => (id) => locations.find((location) => location.id === id)?.city ?? id,
    [locations],
  )

  const swap = () => setForm((prev) => ({ ...prev, origin: prev.destination, destination: prev.origin }))

  const changeOrigin = (originId) => {
    setForm((prev) => ({
      ...prev,
      origin: originId,
      destination:
        prev.destination === originId
          ? (locations.find((location) => location.id !== originId)?.id ?? prev.destination)
          : prev.destination,
      pickupPointId: '',
    }))
  }

  const submit = (event) => {
    event.preventDefault()
    setParams({
      origin: form.origin,
      destination: form.destination,
      date: form.date,
      pickup: form.pickupPointId,
    })
  }

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Pilih armada</p>
          <h1>
            {cityName(origin)} ke {cityName(destination)}
          </h1>
        </div>
        <Link to="/pesanan" className="head-action">
          Tiket
        </Link>
      </header>

      <form className="panel search-panel" onSubmit={submit}>
        <div className="search-grid">
          <label className="field">
            <span>Dari</span>
            <select value={form.origin} onChange={(event) => changeOrigin(event.target.value)}>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {location.city}
                </option>
              ))}
            </select>
          </label>

          <button type="button" className="swap-btn" onClick={swap} aria-label="Tukar kota asal dan tujuan">
            <SwapIcon />
          </button>

          <label className="field">
            <span>Ke</span>
            <select
              value={form.destination}
              onChange={(event) => setForm((prev) => ({ ...prev, destination: event.target.value }))}
            >
              {locations
                .filter((location) => location.id !== form.origin)
                .map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.city}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <div className="form-row">
          <label className="field">
            <span>Tanggal berangkat</span>
            <div className="input-icon">
              <CalendarIcon />
              <input
                type="date"
                min={todayIso()}
                value={form.date}
                onChange={(event) => setForm((prev) => ({ ...prev, date: event.target.value }))}
              />
            </div>
          </label>

          <label className="field">
            <span>Titik jemput</span>
            <select
              value={form.pickupPointId}
              onChange={(event) => setForm((prev) => ({ ...prev, pickupPointId: event.target.value }))}
            >
              {pickupPoints.map((point) => (
                <option key={point.id} value={point.id}>
                  {point.name}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button type="submit" className="btn btn-primary btn-block">
          <SearchIcon width={18} height={18} />
          Perbarui pencarian
        </button>
      </form>

      <div className="result-head">
        <h2>{schedules.length} armada tersedia</h2>
        <p>{dateLong(date)}</p>
      </div>

      <ErrorBox message={error} />

      {loading ? (
        <Loading label="Mencari armada…" />
      ) : schedules.length ? (
        <div className="schedule-list">
          {schedules.map((schedule) => (
            <ScheduleCard key={schedule.id} schedule={schedule} date={date} pickupPointId={pickup} />
          ))}
        </div>
      ) : (
        !error && (
          <EmptyState
            emoji="🗺️"
            title={date === todayIso() ? 'Jadwal hari ini sudah berangkat' : 'Belum ada armada'}
            description={
              date === todayIso()
                ? 'Semua jadwal hari ini sudah lewat. Coba pilih tanggal besok.'
                : 'Rute ini belum tersedia pada tanggal tersebut. Coba tanggal atau rute lain.'
            }
            action={
              <Link className="btn btn-ghost" to="/">
                Kembali ke beranda
              </Link>
            }
          />
        )
      )}
    </div>
  )
}
