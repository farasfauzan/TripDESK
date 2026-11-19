import express from 'express'
import cors from 'cors'
import catalog from './routes/catalog.js'
import bookings from './routes/bookings.js'
import profile from './routes/profile.js'

export const app = express()

app.use(cors())
app.use(express.json())

app.use('/api', catalog)
app.use('/api', bookings)
app.use('/api', profile)

app.use((req, res) => {
  res.status(404).json({ error: { code: 'NOT_FOUND', message: `Endpoint ${req.method} ${req.originalUrl} tidak ada.` } })
})

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Terjadi kesalahan pada server.' } })
})
