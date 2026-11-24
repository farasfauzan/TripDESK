import { Router } from 'express'
import { schedules } from '../data.js'
import { addBooking, bookedSeats, bookingCode, findBooking, listBookings, persistBookings, removeBooking, removeHistory } from '../store.js'
import { hasDeparted, isIsoDate, shiftTime, todayIso } from '../dates.js'
import { deriveStatus } from '../bookingStatus.js'
import { etaForPickup } from '../eta.js'

const router = Router()

const serialize = (booking) => ({
  ...booking,
  status: deriveStatus(booking),
  seatLabels: booking.seats.map((no) => `Kursi ${no}`),
})

router.get('/bookings', (req, res) => {
  const status = req.query.status
  const data = listBookings()
    .map(serialize)
    .filter((b) => (status ? b.status === status : true))
  res.json({ data, meta: { count: data.length } })
})

router.get('/bookings/:code', (req, res) => {
  const booking = findBooking(req.params.code)
  if (!booking) return res.status(404).json({ error: { code: 'BOOKING_NOT_FOUND', message: 'Pesanan tidak ditemukan.' } })
  res.json({ data: serialize(booking) })
})

router.post('/bookings', (req, res) => {
  const { scheduleId, date, seats, passenger, pickupPointId } = req.body ?? {}

  const schedule = schedules.find((s) => s.id === scheduleId)
  if (!schedule) {
    return res.status(400).json({ error: { code: 'INVALID_SCHEDULE', message: 'Jadwal tidak valid.' } })
  }

  if (!isIsoDate(date) || date < todayIso()) {
    return res.status(400).json({ error: { code: 'INVALID_DATE', message: 'Tanggal keberangkatan tidak valid.' } })
  }

  if (hasDeparted(schedule, date)) {
    return res.status(409).json({
      error: { code: 'TRIP_STARTED', message: 'Jadwal ini sudah berangkat. Pilih jadwal lain.' },
    })
  }

  const seatNumbers = Array.isArray(seats) ? [...new Set(seats.map(Number))] : []
  if (seatNumbers.length === 0 || seatNumbers.length > 6) {
    return res.status(400).json({ error: { code: 'INVALID_SEATS', message: 'Pilih 1 sampai 6 kursi.' } })
  }
  if (seatNumbers.some((no) => !Number.isInteger(no) || no < 1 || no > schedule.seatLayout)) {
    return res.status(400).json({ error: { code: 'INVALID_SEATS', message: 'Nomor kursi di luar armada.' } })
  }

  const taken = bookedSeats(schedule.id, date)
  if (seatNumbers.some((no) => taken.has(no))) {
    return res.status(409).json({ error: { code: 'SEAT_TAKEN', message: 'Sebagian kursi sudah dipesan orang lain.' } })
  }

  const name = String(passenger?.name ?? '').trim()
  const phone = String(passenger?.phone ?? '').trim()
  if (name.length < 3) {
    return res.status(400).json({ error: { code: 'INVALID_NAME', message: 'Nama penumpang minimal 3 karakter.' } })
  }
  if (phone.length < 8) {
    return res.status(400).json({ error: { code: 'INVALID_PHONE', message: 'Nomor HP tidak valid.' } })
  }

  const pickupPoint = pickupPointId
    ? schedule.pickupPoints.find((p) => p.id === pickupPointId)
    : schedule.pickupPoints[0]
  if (!pickupPoint) {
    return res.status(400).json({ error: { code: 'INVALID_PICKUP', message: 'Titik jemput tidak tersedia.' } })
  }

  const booking = {
    code: bookingCode(),
    scheduleId: schedule.id,
    scheduleCode: schedule.code,
    date,
    origin: schedule.origin,
    destination: schedule.destination,
    departTime: schedule.departTime,
    arriveTime: schedule.arriveTime,
    seats: seatNumbers.sort((a, b) => a - b),
    passenger: { name, phone, email: String(passenger?.email ?? '').trim() },
    pickupPoint: {
      id: pickupPoint.id,
      name: pickupPoint.name,
      time: shiftTime(schedule.departTime, -(pickupPoint.offsetMinutes ?? 0)),
    },
    fleet: `${schedule.fleet.model} · ${schedule.fleet.plate}`,
    pricePerSeat: schedule.price,
    total: schedule.price * seatNumbers.length,
    etaMinutes: etaForPickup(schedule.id, pickupPoint.id),
    status: 'terjadwal',
    createdAt: new Date().toISOString(),
  }

  addBooking(booking)
  res.status(201).json({ data: serialize(booking) })
})

router.patch('/bookings/:code/cancel', (req, res) => {
  const booking = findBooking(req.params.code)
  if (!booking) return res.status(404).json({ error: { code: 'BOOKING_NOT_FOUND', message: 'Pesanan tidak ditemukan.' } })
  const current = deriveStatus(booking)
  if (current === 'dibatalkan') {
    return res.status(409).json({ error: { code: 'ALREADY_CANCELLED', message: 'Pesanan sudah dibatalkan.' } })
  }
  if (current !== 'terjadwal') {
    return res.status(409).json({
      error: { code: 'TRIP_STARTED', message: 'Perjalanan sudah dimulai, pesanan tidak bisa dibatalkan.' },
    })
  }
  booking.status = 'dibatalkan'
  persistBookings()
  res.json({ data: serialize(booking) })
})

// Hapus satu pesanan dari riwayat. Pesanan aktif harus dibatalkan dulu.
router.delete('/bookings/:code', (req, res) => {
  const booking = findBooking(req.params.code)
  if (!booking) return res.status(404).json({ error: { code: 'BOOKING_NOT_FOUND', message: 'Pesanan tidak ditemukan.' } })

  const current = deriveStatus(booking)
  if (current === 'terjadwal' || current === 'berlangsung') {
    return res.status(409).json({
      error: { code: 'TRIP_ACTIVE', message: 'Pesanan yang masih aktif tidak bisa dihapus. Batalkan dulu.' },
    })
  }

  removeBooking(booking.code)
  res.json({ data: { code: booking.code, deleted: true } })
})

// Bersihkan seluruh riwayat (selesai + dibatalkan). Pesanan aktif tetap disimpan.
router.delete('/bookings', (_req, res) => {
  const removed = removeHistory()
  res.json({ data: { removed } })
})

export default router
