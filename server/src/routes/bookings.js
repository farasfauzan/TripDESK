import { Router } from 'express'
import { schedules } from '../data.js'
import { addBooking, bookedSeats, bookingCode, cancelBooking, findBooking, listBookings, removeBooking } from '../store.js'
import { hasDeparted, isIsoDate, shiftTime, todayIso } from '../dates.js'
import { deriveStatus } from '../bookingStatus.js'
import { etaForPickup } from '../eta.js'
import { asyncHandler } from '../asyncHandler.js'

const router = Router()

const serialize = (booking) => ({
  ...booking,
  status: deriveStatus(booking),
  seatLabels: booking.seats.map((no) => `Kursi ${no}`),
})

router.get('/bookings', asyncHandler(async (req, res) => {
  const status = req.query.status
  const data = (await listBookings())
    .map(serialize)
    .filter((b) => (status ? b.status === status : true))
  res.json({ data, meta: { count: data.length } })
}))

router.get('/bookings/:code', asyncHandler(async (req, res) => {
  const booking = await findBooking(req.params.code)
  if (!booking) return res.status(404).json({ error: { code: 'BOOKING_NOT_FOUND', message: 'Pesanan tidak ditemukan.' } })
  res.json({ data: serialize(booking) })
}))

router.post('/bookings', asyncHandler(async (req, res) => {
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

  const taken = await bookedSeats(schedule.id, date)
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

  try {
    await addBooking(booking)
  } catch (error) {
    if (error.code === 'SEAT_TAKEN') {
      return res.status(409).json({ error: { code: 'SEAT_TAKEN', message: 'Sebagian kursi sudah dipesan orang lain.' } })
    }
    throw error
  }
  res.status(201).json({ data: serialize(booking) })
}))

router.patch('/bookings/:code/cancel', asyncHandler(async (req, res) => {
  const booking = await findBooking(req.params.code)
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
  const updated = await cancelBooking(booking.code)
  res.json({ data: serialize(updated) })
}))

// Hapus satu pesanan dari riwayat. Pesanan aktif harus dibatalkan dulu.
router.delete('/bookings/:code', asyncHandler(async (req, res) => {
  const booking = await findBooking(req.params.code)
  if (!booking) return res.status(404).json({ error: { code: 'BOOKING_NOT_FOUND', message: 'Pesanan tidak ditemukan.' } })

  const current = deriveStatus(booking)
  if (current === 'terjadwal' || current === 'berlangsung') {
    return res.status(409).json({
      error: { code: 'TRIP_ACTIVE', message: 'Pesanan yang masih aktif tidak bisa dihapus. Batalkan dulu.' },
    })
  }

  await removeBooking(booking.code)
  res.json({ data: { code: booking.code, deleted: true } })
}))

// Catatan: tidak ada endpoint "hapus semua riwayat". Tanpa autentikasi, satu
// endpoint seperti itu = satu perintah untuk mengosongkan database orang lain.
// Klien menghapus riwayat satu per satu lewat DELETE /bookings/:code.

export default router
