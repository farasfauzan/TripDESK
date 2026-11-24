import { query } from './db.js'
import { deriveStatus } from './bookingStatus.js'

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

export async function bookedSeats(scheduleId, date) {
  const { rows } = await query(
    `SELECT unnest(seats) AS seat
       FROM bookings
      WHERE schedule_id = $1 AND travel_date = $2::date AND status <> 'dibatalkan'`,
    [scheduleId, date],
  )
  return new Set(rows.map((row) => Number(row.seat)))
}

export async function seatMap(scheduleId, date, total) {
  const taken = demoSeats(scheduleId, date, total)
  for (const seat of await bookedSeats(scheduleId, date)) taken.add(seat)
  const seats = Array.from({ length: total }, (_, index) => {
    const no = index + 1
    return { no, taken: taken.has(no) }
  })
  return { total, seats, seatsLeft: total - taken.size }
}

export async function listBookings() {
  const { rows } = await query('SELECT data FROM bookings ORDER BY created_at DESC')
  return rows.map((row) => row.data)
}

export async function findBooking(code) {
  const { rows } = await query('SELECT data FROM bookings WHERE lower(code) = lower($1)', [code])
  return rows[0]?.data ?? null
}

export async function addBooking(booking) {
  const values = [
    booking.code,
    booking.scheduleId,
    booking.date,
    booking.seats,
    booking.status,
    JSON.stringify(booking),
    booking.createdAt,
  ]
  const sql = `INSERT INTO bookings (code, schedule_id, travel_date, seats, status, data, created_at)
               VALUES ($1, $2, $3::date, $4::int[], $5, $6::jsonb, $7::timestamptz)`

  // Kode dihasilkan acak; ulangi bila ada tabrakan dengan pesanan yang ada.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const result = await query(sql, values)
    if (result.rowCount === 1) return booking
    booking.code = bookingCode()
    values[0] = booking.code
    values[5] = JSON.stringify(booking)
  }
  throw new Error('Gagal membuat kode pesanan yang unik.')
}

// Hapus satu pesanan. Yang masih aktif (terjadwal/berlangsung) tidak boleh
// hilang dari riwayat karena kursinya masih terpakai — dicek di route.
export async function removeBooking(code) {
  const { rowCount } = await query('DELETE FROM bookings WHERE lower(code) = lower($1)', [code])
  return rowCount > 0
}

export async function cancelBooking(code) {
  const { rows } = await query(
    `UPDATE bookings
        SET status = 'dibatalkan',
            data = jsonb_set(data, '{status}', '"dibatalkan"')
      WHERE lower(code) = lower($1)
      RETURNING data`,
    [code],
  )
  return rows[0]?.data ?? null
}

// Bersihkan riwayat: hanya selesai & dibatalkan yang dibuang.
export async function removeHistory() {
  const all = await listBookings()
  const removable = all
    .filter((booking) => !['terjadwal', 'berlangsung'].includes(deriveStatus(booking)))
    .map((booking) => booking.code)
  if (removable.length === 0) return 0

  const { rowCount } = await query('DELETE FROM bookings WHERE code = ANY($1::text[])', [removable])
  return rowCount
}

export function bookingCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 5; i += 1) suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `TD-${suffix}`
}
