import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { getLocations, getNearby, getPickupPoints } from '../shared/api.js'
import { dateLong, rupiah, todayIso } from '../shared/utils.js'
import ZoomMap from '../map/ZoomMap.jsx'
import { EmptyState, ErrorBox, Loading } from '../shared/State.jsx'
import {
  ArrowRightIcon,
  CalendarIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  FleetIcon,
} from '../shared/Icons.jsx'
import { gsap, useGSAP } from '../shared/animations.js'

export default function ArmadaMap() {
  const scope = useRef(null)
  const stageRef = useRef(null)
  const sheetRef = useRef(null)
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const location = useLocation()
  // Datang dari animasi melebar kartu Beranda: peta sudah fullscreen & frame
  // sama, jadi cukup menu yang naik dari bawah.
  const handoff = !!location.state?.fromMapExpand
  // Peta yang datang dari animasi melebar kartu Beranda tidak boleh ikut
  // animasi page-in: halamannya sudah terlihat utuh sejak frame pertama.
  const noEnter = handoff

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
  const [view, setView] = useState('local')
  // LOD jalan skala kampus baru ada untuk Tembalang/UNDIP.
  const campusDetail = form.pickupPointId === 'SMG-1'
  const [picker, setPicker] = useState(null)
  // Pratinjau saat kursor/fokus di atas opsi picker: peta ikut menyesuaikan
  // sebelum pilihan benar-benar diklik.
  const [preview, setPreview] = useState({ dest: null, pickup: null })
  const viewBeforePicker = useRef('local')

  const effectiveDate = mode === 'now' ? todayIso() : form.date
  const selectedPickup =
    pickupPoints.find((point) => point.id === form.pickupPointId) ?? pickupPoints[0] ?? null
  const pickupName = selectedPickup?.name ?? 'Titik jemput'

  const pickupShort = pickupName.replace(/\s*\(.*\)$/, '')
  const destinationName =
    locations.find((location) => location.id === form.destination)?.city ?? 'Jepara'

  // Nilai yang dipakai peta: ikut pratinjau saat opsi picker di-hover.
  const mapDestinationId = preview.dest ?? form.destination
  const mapPickupId = preview.pickup ?? form.pickupPointId
  const mapDestinationName =
    locations.find((location) => location.id === mapDestinationId)?.city ?? destinationName
  const mapPickup = pickupPoints.find((p) => p.id === mapPickupId) ?? selectedPickup ?? null
  const mapPickupName = mapPickup?.name ?? pickupName

  const changeDestination = (value) => {
    setForm((prev) => ({ ...prev, destination: value }))
    setView('island')
  }

  const changePickup = (value) => {
    setForm((prev) => ({ ...prev, pickupPointId: value }))
    setView('local')
  }

  const openDestination = () => {
    viewBeforePicker.current = view
    setView('island')
    setPicker('destination')
  }

  const openPickup = () => {
    viewBeforePicker.current = view
    setView('local')
    setPicker('pickup')
  }

  const clearPreview = () => setPreview({ dest: null, pickup: null })

  const closePicker = () => {
    clearPreview()
    setPicker(null)
    setView(viewBeforePicker.current)
  }

  const chooseDestination = (value) => {
    clearPreview()
    changeDestination(value)
    setPicker(null)
  }

  const choosePickup = (value) => {
    clearPreview()
    changePickup(value)
    setPicker(null)
  }

  useEffect(() => {
    if (!campusDetail) setView((prev) => (prev === 'street' ? 'local' : prev))
  }, [campusDetail])

  useEffect(() => {
    if (!picker) return undefined
    const onKey = (event) => {
      if (event.key === 'Escape') closePicker()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [picker])

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
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      const stage = stageRef.current
      const sheet = sheetRef.current

      if (handoff && stage && sheet) {
        // Peta sudah fullscreen dengan frame sama. Panel menu jangan digeser
        // dari bawah: 470 px kosong selama ~0,3 s terbaca sebagai halaman
        // "patah". Panel langsung duduk, isinya yang naik halus.
        gsap.set(sheet, { yPercent: 0, autoAlpha: 1 })
        gsap.set('.map-back, .map-count, .map-toggle', { autoAlpha: 0 })

        if (reduce) {
          gsap.set('.map-back, .map-count, .map-toggle', { autoAlpha: 1 })
          return undefined
        }

        // Tidak ada onComplete: halaman ini memakai .no-enter, jadi animasi
        // page-in tidak pernah hidup dan layar tidak memudar setelah mendarat.
        const timeline = gsap
          .timeline({ defaults: { ease: 'power2.out' } })
          .to('.map-back, .map-count, .map-toggle', { autoAlpha: 1, duration: 0.24, stagger: 0.035 }, 0)
          // Label, cincin radius, dan penanda jemput juga jangan "nongol" satu
          // frame: kartu Beranda tidak punya lapisan ini, jadi tanpa fade
          // serah-terima terbaca sebagai kedipan.
          .from(
            '.zm-radius, .zm-user-label, .zm-city-name, .zm-city-place, .zm-pickup',
            { opacity: 0, duration: 0.34, stagger: 0.02 },
            0,
          )
          .from(
            '.sheet-grip, .armada-sheet-head, .armada-controls',
            { opacity: 0, y: 14, duration: 0.34, stagger: 0.05 },
            0.02,
          )

        return () => timeline.kill()
      }

      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          .from('.map-back, .map-count, .map-toggle', {
            opacity: 0,
            y: -10,
            duration: 0.3,
            stagger: 0.05,
          })
          .from('.armada-sheet', { yPercent: 22, opacity: 0, duration: 0.5 }, '-=0.35')
          .from('.armada-controls', { opacity: 0, y: 8, duration: 0.3 }, '-=0.3')

        return undefined
      })
      return () => mm.revert()
    },
    { scope },
  )

  const zoomIn = () =>
    setView((prev) =>
      prev === 'island' ? 'local' : prev === 'local' && campusDetail ? 'street' : prev,
    )
  const zoomOut = () =>
    setView((prev) => (prev === 'street' ? 'local' : prev === 'local' ? 'island' : prev))

  const goBack = contextSafe(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      navigate(-1)
      return
    }
    gsap
      .timeline({ onComplete: () => navigate(-1) })
      .to('.armada-list', { opacity: 0, y: 8, duration: 0.18 }, 0)
      .to('.armada-sheet', { yPercent: 26, opacity: 0, duration: 0.26, ease: 'power2.in' }, 0.05)
      .to('.map-stage', { scale: 0.96, opacity: 0, duration: 0.3, ease: 'power2.in' }, 0.1)
  })

  useGSAP(
    () => {
      if (!armada.length) return
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.fromTo(
          '.zm-car',
          { opacity: 0 },
          { opacity: 1, duration: 0.3, ease: 'power2.out', stagger: 0.06 },
        )
        gsap.fromTo(
          '.armada-card',
          { y: 12, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.35,
            ease: 'power2.out',
            stagger: 0.05,
          },
        )
      })
      return () => mm.revert()
    },
    { scope, dependencies: [armada] },
  )

  return (
    <div className={`page armada-page${noEnter ? ' no-enter' : ''}`} ref={scope}>
      <div className="armada-map-wrap">
        <div className="map-stage" ref={stageRef}>
          {/* Bingkai panggung dihitung dari rasionya sendiri, jadi area yang
              tampil sudah sama dengan kartu Beranda saat melebar. Menurunkan
              kamera dari frame Beranda justru memicu zoom ~18%. */}
          <ZoomMap
            view={view}
            origin="Semarang"
            destination={mapDestinationName}
            armada={armada}
            date={effectiveDate}
            pickupId={mapPickupId}
            pickupName={mapPickupName}
          />
        </div>
        {view === 'island' ? (
          <span className="java-note">Batas provinsi · peta ilustrasi</span>
        ) : null}
        <button type="button" className="map-back" onClick={goBack} aria-label="Kembali">
          <ChevronLeftIcon />
        </button>
        <span className="map-count">
          <i aria-hidden="true" />
          {loading
            ? 'mencari…'
            : view === 'island'
              ? 'Pulau Jawa'
              : view === 'street'
                ? 'Detail kampus'
                : `${armada.length} armada`}
        </span>
        <div className="map-zoom">
          <button
            type="button"
            onClick={zoomIn}
            aria-label={
              campusDetail
                ? 'Perbesar peta ke detail kampus'
                : 'Detail kampus belum tersedia di titik jemput ini'
            }
            disabled={view === 'street' || !campusDetail}
          >
            <span aria-hidden="true">+</span>
          </button>
          <button
            type="button"
            onClick={zoomOut}
            aria-label="Perkecil peta"
            disabled={view === 'island'}
          >
            <span aria-hidden="true">−</span>
          </button>
        </div>
        <button
          type="button"
          className="map-toggle"
          onClick={() => setView((prev) => (prev === 'island' ? 'local' : 'island'))}
        >
          {view === 'island' ? 'Lihat sekitar' : 'Lihat Pulau Jawa'}
        </button>
      </div>

      <div className="armada-sheet" ref={sheetRef}>
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
            <div className="field">
              <span>Tujuan</span>
              <button type="button" className="field-select" onClick={openDestination}>
                <span>{destinationName}</span>
                <ChevronDownIcon width={16} height={16} />
              </button>
            </div>

            <div className="field">
              <span>Titik jemput</span>
              <button type="button" className="field-select" onClick={openPickup}>
                <span>{pickupShort}</span>
                <ChevronDownIcon width={16} height={16} />
              </button>
            </div>
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

      {picker
        ? createPortal(
            <>
              <button
                type="button"
                className="picker-backdrop"
                aria-label="Tutup pilihan"
                onClick={closePicker}
              />
              <div
                className="picker-sheet"
                role="dialog"
                aria-modal="true"
                aria-label={picker === 'destination' ? 'Pilih tujuan' : 'Pilih titik jemput'}
              >
                <div className="picker-head">
                  <h3>{picker === 'destination' ? 'Mau ke mana?' : 'Jemput di mana?'}</h3>
                  <button type="button" className="picker-close" onClick={closePicker}>
                    Tutup
                  </button>
                </div>
                <div className="picker-list" role="listbox" onMouseLeave={clearPreview}>
                  {picker === 'destination'
                    ? locations.map((location) => (
                        <button
                          key={location.id}
                          type="button"
                          role="option"
                          aria-selected={form.destination === location.id}
                          className={`picker-option${form.destination === location.id ? ' is-active' : ''}`}
                          onClick={() => chooseDestination(location.id)}
                          onMouseEnter={() =>
                            setPreview((prev) => ({
                              ...prev,
                              dest: location.id,
                            }))
                          }
                          onMouseLeave={() => setPreview((prev) => ({ ...prev, dest: null }))}
                          onFocus={() =>
                            setPreview((prev) => ({
                              ...prev,
                              dest: location.id,
                            }))
                          }
                          onBlur={() => setPreview((prev) => ({ ...prev, dest: null }))}
                        >
                          <span>{location.city}</span>
                          <small>{location.province}</small>
                        </button>
                      ))
                    : pickupPoints.map((point) => (
                        <button
                          key={point.id}
                          type="button"
                          role="option"
                          aria-selected={form.pickupPointId === point.id}
                          className={`picker-option${form.pickupPointId === point.id ? ' is-active' : ''}`}
                          onClick={() => choosePickup(point.id)}
                          onMouseEnter={() =>
                            setPreview((prev) => ({
                              ...prev,
                              pickup: point.id,
                            }))
                          }
                          onMouseLeave={() => setPreview((prev) => ({ ...prev, pickup: null }))}
                          onFocus={() =>
                            setPreview((prev) => ({
                              ...prev,
                              pickup: point.id,
                            }))
                          }
                          onBlur={() => setPreview((prev) => ({ ...prev, pickup: null }))}
                        >
                          <span>{point.name}</span>
                          <small>{point.beforeDepartureMinutes} mnt sebelum berangkat</small>
                        </button>
                      ))}
                </div>
              </div>
            </>,
            document.body,
          )
        : null}
    </div>
  )
}
