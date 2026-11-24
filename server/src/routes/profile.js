import { Router } from 'express'
import { profile } from '../data.js'
import { listBookings } from '../store.js'
import { asyncHandler } from '../asyncHandler.js'

const router = Router()

router.get('/profile', asyncHandler(async (_req, res) => {
  const bookings = await listBookings()
  const active = bookings.filter((b) => b.status === 'terjadwal')
  const data = {
    ...profile,
    stats: {
      totalBooking: bookings.length,
      activeBooking: active.length,
      totalSpend: active.reduce((sum, b) => sum + b.total, 0),
      totalTrip: active.length,
    },
  }
  res.json({ data })
}))

export default router
