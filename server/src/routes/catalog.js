import { Router } from 'express'
import { locations, pickupPointsByCity, routes, schedules } from '../data.js'
import { seatMap } from '../store.js'
import { hasDeparted, isIsoDate, shiftTime, todayIso } from '../dates.js'
import { etaForPickup, distanceForPickup } from '../eta.js'

const router = Router()

const byCityOrId = (value) => {
  if (!value) return null
  const needle = String(value).trim().toLowerCase()
  return locations.find((l) => l.id.toLowerCase() === needle || l.city.toLowerCase() === needle) ?? null
}

// Tanggal kosong berarti hari ini; tanggal yang dikirim tapi tidak valid ditolak.
const readDate = (req, res) => {
  const value = req.query.date
  if (!value) return todayIso()
  if (!isIsoDate(value)) {
    res.status(400).json({
      error: { code: 'INVALID_DATE', message: 'Parameter date harus tanggal valid berformat YYYY-MM-DD.' },
    })
    return null
  }
  return value
}

const toSummary = (schedule, date, pickup = null) => {
  const { seatsLeft } = seatMap(schedule.id, date, schedule.seatLayout)
  return {
    id: schedule.id,
    code: schedule.code,
    routeId: schedule.routeId,
    origin: schedule.origin,
    destination: schedule.destination,
    departTime: schedule.departTime,
    arriveTime: schedule.arriveTime,
    durationMinutes: schedule.durationMinutes,
    price: schedule.price,
    distanceKm: schedule.distanceKm,
    fleet: schedule.fleet.model,
    fleetType: schedule.fleet.type,
    seatsLeft,
    date,
    pickupPoint: pickup ? { id: pickup.id, name: pickup.name } : null,
    pickupTime: pickup ? shiftTime(schedule.departTime, -(pickup.offsetMinutes ?? 0)) : null,
    pickupEtaMinutes: pickup ? etaForPickup(schedule.id, pickup.id) : null,
  }
}

const findPickupPoint = (pickupPointId) => {
  for (const [cityId, points] of Object.entries(pickupPointsByCity)) {
    const point = points.find((item) => item.id === pickupPointId)
    if (point) return { ...point, cityId }
  }
  return null
}

router.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'tripdesk-api', time: new Date().toISOString() })
})

router.get('/locations', (_req, res) => {
  res.json({ data: locations })
})

router.get('/pickup-points', (req, res) => {
  const city = byCityOrId(req.query.origin ?? 'SMG')
  if (!city) {
    return res.status(400).json({ error: { code: 'INVALID_ORIGIN', message: 'Kota asal tidak dikenal.' } })
  }
  const data = (pickupPointsByCity[city.id] ?? []).map((point) => ({
    id: point.id,
    name: point.name,
    beforeDepartureMinutes: point.offsetMinutes,
  }))
  res.json({ data, meta: { city: city.city } })
})

router.get('/routes', (req, res) => {
  const origin = byCityOrId(req.query.origin)
  const destination = byCityOrId(req.query.destination)
  const date = readDate(req, res)
  if (!date) return

  const data = routes
    .filter((route) => (origin ? route.originId === origin.id : true))
    .filter((route) => (destination ? route.destinationId === destination.id : true))
    .map((route) => {
      const routeSchedules = schedules
        .filter((s) => s.routeId === route.id)
        .filter((s) => !hasDeparted(s, date))
      const cheapest = routeSchedules.reduce((min, s) => Math.min(min, s.price), Number.POSITIVE_INFINITY)
      const seatsLeft = routeSchedules.reduce((sum, s) => sum + seatMap(s.id, date, s.seatLayout).seatsLeft, 0)
      return {
        ...route,
        scheduleCount: routeSchedules.length,
        firstDeparture: routeSchedules[0]?.departTime ?? null,
        lastDeparture: routeSchedules.at(-1)?.departTime ?? null,
        cheapestPrice: Number.isFinite(cheapest) ? cheapest : route.price,
        seatsLeft,
      }
    })

  res.json({ data, meta: { date, count: data.length } })
})

router.get('/routes/:id', (req, res) => {
  const route = routes.find((r) => r.id === req.params.id)
  if (!route) return res.status(404).json({ error: { code: 'ROUTE_NOT_FOUND', message: 'Rute tidak ditemukan.' } })

  const date = readDate(req, res)
  if (!date) return
  const data = schedules
    .filter((s) => s.routeId === route.id)
    .map((s) => toSummary(s, date))

  res.json({ data: { route, schedules: data }, meta: { date } })
})

router.get('/schedules', (req, res) => {
  const origin = byCityOrId(req.query.origin)
  const destination = byCityOrId(req.query.destination)
  const date = readDate(req, res)
  if (!date) return

  const pickup = req.query.pickupPointId ? findPickupPoint(req.query.pickupPointId) : null

  const data = schedules
    .filter((s) => (origin ? s.originId === origin.id : true))
    .filter((s) => (destination ? s.destinationId === destination.id : true))
    .filter((s) => !hasDeparted(s, date))
    .map((s) => toSummary(s, date, pickup?.cityId === s.originId ? pickup : null))
    .sort((a, b) => a.departTime.localeCompare(b.departTime))

  res.json({
    data,
    meta: {
      date,
      count: data.length,
      origin: origin?.city ?? null,
      destination: destination?.city ?? null,
      pickupPoint: pickup ? { id: pickup.id, name: pickup.name } : null,
    },
  })
})

router.get('/nearby', (req, res) => {
  const origin = byCityOrId(req.query.origin ?? 'SMG')
  if (!origin) {
    return res.status(400).json({ error: { code: 'INVALID_ORIGIN', message: 'Kota asal tidak dikenal.' } })
  }
  const destination = byCityOrId(req.query.destination)
  const date = readDate(req, res)
  if (!date) return

  const requested = req.query.pickupPointId ? findPickupPoint(req.query.pickupPointId) : null
  const fallback = pickupPointsByCity[origin.id]?.[0]
  const pickup =
    requested && requested.cityId === origin.id
      ? requested
      : fallback
        ? { ...fallback, cityId: origin.id }
        : null

  const data = schedules
    .filter((schedule) => schedule.originId === origin.id)
    .filter((schedule) => !hasDeparted(schedule, date))
    .filter((schedule) => (destination ? schedule.destinationId === destination.id : true))
    .map((schedule) => ({
      ...toSummary(schedule, date, pickup),
      distanceKm: distanceForPickup(schedule.id, pickup?.id ?? 'none'),
    }))
    .filter((schedule) => schedule.seatsLeft > 0 && schedule.distanceKm <= 5)
    .sort((a, b) => a.distanceKm - b.distanceKm || a.pickupEtaMinutes - b.pickupEtaMinutes)

  res.json({
    data,
    meta: {
      date,
      origin: origin.city,
      destination: destination?.city ?? null,
      pickupPoint: pickup ? { id: pickup.id, name: pickup.name } : null,
      radiusKm: 5,
      count: data.length,
    },
  })
})

router.get('/schedules/:id', (req, res) => {  const schedule = schedules.find((s) => s.id === req.params.id)
  if (!schedule) return res.status(404).json({ error: { code: 'SCHEDULE_NOT_FOUND', message: 'Jadwal tidak ditemukan.' } })

  const date = readDate(req, res)
  if (!date) return
  const availability = seatMap(schedule.id, date, schedule.seatLayout)

  res.json({
    data: {
      ...schedule,
      date,
      seats: availability.seats,
      seatsLeft: availability.seatsLeft,
      // Setiap titik jemput punya jam sendiri, dihitung mundur dari jam berangkat.
      pickupPoints: schedule.pickupPoints
        .map((point) => ({
          id: point.id,
          name: point.name,
          pickupTime: shiftTime(schedule.departTime, -(point.offsetMinutes ?? 0)),
        }))
        .sort((a, b) => a.pickupTime.localeCompare(b.pickupTime)),
    },
  })
})

export default router
