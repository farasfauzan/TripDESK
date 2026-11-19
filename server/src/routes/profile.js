import { Router } from 'express'
import { profile } from '../data.js'
import { listBookings } from '../store.js'

const router = Router()

router.get('/profile', (_req, res) => {
  const bookings = listBookings()
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
})

export default router
