import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { getLocations, getNearby, getPickupPoints } from '../api.js'
import { dateLong, rupiah, todayIso } from '../utils.js'
import NearbyMap from '../components/NearbyMap.jsx'
import { EmptyState, ErrorBox, Loading } from '../components/State.jsx'
import { ArrowRightIcon, CalendarIcon, ChevronLeftIcon, FleetIcon } from '../components/Icons.jsx'
import { gsap, useGSAP } from '../animations.js'

export default function ArmadaMap() {
  const scope = useRef(null)
  const [params] = useSearchParams()
  const navigate = useNavigate()

  const initialDate = params.get('date') ?? todayIso()
  const [mode, setMode] = useState(initialDate === todayIso() ? 'now' : 'schedule')
  const [form, setForm] = useState({
    destination: params.get('destination') ?? 'JPR',
    pickupPointId: params.get('pickup') ?? '',
    date: initialDate,
  })

  const [locations, setLocations] = useState([])
  const [pickupPoints, setPickupPoints] = useState([])
  const [armada, setArmada] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const effectiveDate = mode === 'now' ? todayIso() : form.date
  const selectedPickup =
    pickupPoints.find((point) => point.id === form.pickupPointId) ?? pickupPoints[0] ?? null
  const pickupName = selectedPickup?.name ?? 'Titik jemput'

  useEffect(() => {
    const controller = new AbortController()
    Promise.all([getLocations(controller.signal), getPickupPoints('SMG', controller.signal)])
      .then(([cities, points]) => {
        setLocations(cities.filter((city) => city.id !== 'SMG'))
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
  }, [])

  useEffect(() => {
    if (!form.pickupPointId) return undefined
    const controller = new AbortController()
    setLoading(true)
    setError('')
    getNearby(
      {
        origin: 'SMG',
        destination: form.destination,
        date: effectiveDate,
        pickupPointId: form.pickupPointId,
      },
      controller.signal,
    )
      .then(setArmada)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [form.destination, form.pickupPointId, effectiveDate])

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .fromTo(
            '.nearby-map',
            {
              clipPath: 'inset(7% 8% 16% 8% round 26px)',
              scale: 0.98,
              opacity: 0.55,
            },
            {
              clipPath: 'inset(0% 0% 0% 0% round 0px)',
              scale: 1,
              opacity: 1,
              duration: 0.6,
            },
          )
          .from('.map-back, .map-count', { opacity: 0, y: -10, duration: 0.3, stagger: 0.05 }, '-=0.4')
          .from('.armada-sheet', { yPercent: 22, opacity: 0, duration: 0.5 }, '-=0.35')
          .from('.armada-controls', { opacity: 0, y: 8, duration: 0.3 }, '-=0.3')
      })
      return () => mm.revert()
    },
    { scope },
  )

  const goBack = contextSafe(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate(-1)
      return
    }
    gsap
      .timeline({ onComplete: () => navigate(-1) })
      .to('.armada-list', { opacity: 0, y: 8, duration: 0.18 }, 0)
      .to('.armada-sheet', { yPercent: 26, opacity: 0, duration: 0.26, ease: 'power2.in' }, 0.05)
      .to('.nearby-map', { scale: 0.96, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.1)
  })

  useGSAP(
    () => {
      if (!armada.length) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.nearby-car',
          { scale: 0.7, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(1.6)', stagger: 0.06 },
        )
        gsap.fromTo(
          '.armada-card',
          { y: 12, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out', stagger: 0.05 },
        )
      })
      return () => mm.revert()
    },
    { scope, dependencies: [armada] },
  )

  return (
    <div className="page armada-page" ref={scope}>
      <div className="armada-map-wrap">
        <NearbyMap
          armada={armada}
          date={effectiveDate}
          pickupId={form.pickupPointId}
          pickupName={pickupName}
        />
        <button type="button" className="map-back" onClick={goBack} aria-label="Kembali">
          <ChevronLeftIcon />
        </button>
        <span className="map-count">
          <i aria-hidden="true" />
          {loading ? 'mencari…' : `${armada.length} armada`}
        </span>
      </div>

      <div className="armada-sheet">
        <span className="sheet-grip" aria-hidden="true" />
        <div className="armada-sheet-head">
          <div>
            <p className="eyebrow">Pesan travel</p>
            <h1>Mau ke mana?</h1>
            <p>
              {pickupName} · {dateLong(effectiveDate)}
            </p>
          </div>
          <span className="chip chip-soft">radius 5 km</span>
        </div>

        <div className="armada-controls">
          <div className="form-row">
            <label className="field">
              <span>Tujuan</span>
              <select
                value={form.destination}
                onChange={(event) => setForm((prev) => ({ ...prev, destination: event.target.value }))}
              >
                {locations.map((location) => (
                  <option key={location.id} value={location.id}>
                    {location.city}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Titik jemput</span>
              <select
                value={selectedPickup?.id ?? ''}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, pickupPointId: event.target.value }))
                }
              >
                {pickupPoints.map((point) => (
                  <option key={point.id} value={point.id}>
                    {point.name}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="mode-toggle" role="tablist" aria-label="Waktu keberangkatan">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'now'}
              className={`mode-btn${mode === 'now' ? ' is-active' : ''}`}
              onClick={() => setMode('now')}
            >
              Sekarang
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'schedule'}
              className={`mode-btn${mode === 'schedule' ? ' is-active' : ''}`}
              onClick={() => setMode('schedule')}
            >
              Jadwalkan
            </button>
          </div>

          {mode === 'schedule' ? (
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
          ) : null}
        </div>

        <ErrorBox message={error} />
        {loading ? <Loading label="Mencari armada di sekitar…" /> : null}

        {!loading && !error && armada.length === 0 ? (
          <EmptyState
            title="Belum ada armada"
            description="Semua armada di rute ini sedang penuh atau di luar jangkauan. Coba titik jemput atau tanggal lain."
            action={
              <Link className="btn btn-ghost" to="/">
                Kembali ke beranda
              </Link>
            }
          />
        ) : null}

        {!loading && armada.length ? (
          <>
            <p className="armada-hint">Diurutkan dari armada terdekat · kursi tersedia</p>
            <div className="armada-list">
              {armada.map((item) => (
                <Link
                  className="armada-card"
                  key={item.id}
                  to={`/jadwal/${item.id}?date=${effectiveDate}${form.pickupPointId ? `&pickup=${form.pickupPointId}` : ''}`}
                >
                  <span className="armada-icon">
                    <FleetIcon fleet={item.fleet} width={20} height={20} />
                  </span>
                  <div className="armada-info">
                    <strong>{item.fleet}</strong>
                    <small>
                      {item.fleetType} · {item.distanceKm} km · {item.seatsLeft} kursi
                    </small>
                    <span className="eta-badge">armada ~{item.pickupEtaMinutes} mnt</span>
                  </div>
                  <div className="armada-price">
                    <strong>{rupiah(item.price)}</strong>
                    <span>
                      Pilih <ArrowRightIcon width={12} height={12} />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </div>
  )
}
