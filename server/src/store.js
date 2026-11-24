import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { deriveStatus } from './bookingStatus.js'

const here = path.dirname(fileURLToPath(import.meta.url))
// Di serverless (Vercel) filesystem proyek read-only, jadi simpan ke /tmp:
// POST /bookings tetap jalan, tapi isinya hilang saat instance baru dibuat.
// Host dengan disk persisten bisa menimpa lewat TRIPDESK_DATA_DIR.
const dataDir = process.env.TRIPDESK_DATA_DIR
  ? path.resolve(process.env.TRIPDESK_DATA_DIR)
  : process.env.VERCEL
    ? path.join('/tmp', 'tripdesk-data')
    : path.join(here, '..', 'data')
const file = path.join(dataDir, 'bookings.json')

/** @type {Array<Record<string, any>>} */
let bookings = load()

function load() {
  try {
    const raw = fs.readFileSync(file, 'utf8')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

export function persistBookings() {
  try {
    fs.mkdirSync(dataDir, { recursive: true })
    fs.writeFileSync(file, JSON.stringify(bookings, null, 2))
  } catch (error) {
    // Gagal menulis tidak boleh membuat request ikut 500; data tetap di memori.
    console.warn('[store] gagal menyimpan bookings:', error.message)
  }
}

function hash(text) {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Kursi yang sudah "terjual" pada demo dibuat deterministik per jadwal + tanggal,
// supaya tampilan kursi konsisten tiap kali halaman dibuka.
function demoSeats(scheduleId, date, total) {
  const seed = hash(`${scheduleId}|${date}`)
  const taken = new Set()
  const target = Math.min(total - 2, 1 + (seed % Math.max(2, Math.floor(total / 2))))
  let x = seed || 1
  while (taken.size < target) {
    x = (Math.imul(x, 1103515245) + 12345) >>> 0
    taken.add((x % total) + 1)
  }
  return taken
}

export function bookedSeats(scheduleId, date) {
  const taken = new Set()
  for (const booking of bookings) {
    if (booking.scheduleId === scheduleId && booking.date === date && booking.status !== 'dibatalkan') {
      for (const seat of booking.seats) taken.add(seat)
    }
  }
  return taken
}

export function seatMap(scheduleId, date, total) {
  const taken = demoSeats(scheduleId, date, total)
  for (const seat of bookedSeats(scheduleId, date)) taken.add(seat)
  const seats = Array.from({ length: total }, (_, index) => {
    const no = index + 1
    return { no, taken: taken.has(no) }
  })
  return { total, seats, seatsLeft: total - taken.size }
}

export function listBookings() {
  return [...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export function findBooking(code) {
  return bookings.find((b) => b.code.toLowerCase() === String(code).toLowerCase()) ?? null
}

export function addBooking(booking) {
  bookings = [booking, ...bookings]
  persistBookings()
  return booking
}

// Hapus satu pesanan. Yang masih aktif (terjadwal/berlangsung) tidak boleh
// hilang dari riwayat karena kursinya masih terpakai.
export function removeBooking(code) {
  const before = bookings.length
  bookings = bookings.filter((b) => b.code.toLowerCase() !== String(code).toLowerCase())
  if (bookings.length === before) return false
  persistBookings()
  return true
}

// Bersihkan riwayat: hanya selesai & dibatalkan yang dibuang.
export function removeHistory() {
  const kept = bookings.filter((b) => {
    const status = deriveStatus(b)
    return status === 'terjadwal' || status === 'berlangsung'
  })
  const removed = bookings.length - kept.length
  if (removed > 0) {
    bookings = kept
    persistBookings()
  }
  return removed
}

export function bookingCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 5; i += 1) suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `TD-${suffix}`
}
