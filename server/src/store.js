import { pool, query } from './db.js'
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
  // Kursi dipesan lewat tabel booking_seats; kursi pesanan yang dibatalkan
  // dihapus dari tabel ini, jadi tidak perlu filter status di sini.
  const { rows } = await query(
    'SELECT seat FROM booking_seats WHERE schedule_id = $1 AND travel_date = $2::date',
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
  const client = await pool.connect()
  try {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await client.query('begin')
      try {
        const inserted = await client.query(
          `INSERT INTO bookings (code, schedule_id, travel_date, seats, status, data, created_at)
                VALUES ($1, $2, $3::date, $4::int[], $5, $6::jsonb, $7::timestamptz)
           ON CONFLICT (code) DO NOTHING
             RETURNING code`,
          [booking.code, booking.scheduleId, booking.date, booking.seats, booking.status, booking, booking.createdAt],
        )

        // Kode acak bisa bentrok; ulangi dengan kode baru.
        if (inserted.rowCount === 0) {
          await client.query('rollback')
          booking.code = bookingCode()
          continue
        }

        // Klaim kursi. Primary key (schedule_id, travel_date, seat) yang
        // memutuskan: kalau ada yang sudah diambil, jumlahnya kurang.
        const claim = await client.query(
          `WITH ins AS (
             INSERT INTO booking_seats (schedule_id, travel_date, seat, code)
             SELECT $1, $2::date, s, $3 FROM unnest($4::int[]) AS s
             ON CONFLICT DO NOTHING
             RETURNING 1
           )
           SELECT count(*)::int AS n FROM ins`,
          [booking.scheduleId, booking.date, booking.code, booking.seats],
        )

        if (claim.rows[0].n !== booking.seats.length) {
          await client.query('rollback')
          const error = new Error('Sebagian kursi sudah dipesan orang lain.')
          error.code = 'SEAT_TAKEN'
          throw error
        }

        await client.query('commit')
        return booking
      } catch (error) {
        await client.query('rollback').catch(() => {})
        throw error
      }
    }
    throw new Error('Gagal membuat kode pesanan yang unik.')
  } finally {
    client.release()
  }
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
  if (!rows[0]) return null

  // Lepaskan kursi supaya bisa dipesan orang lain.
  await query('DELETE FROM booking_seats WHERE lower(code) = lower($1)', [code])
  return rows[0].data
}

export function bookingCode() {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let suffix = ''
  for (let i = 0; i < 5; i += 1) suffix += alphabet[Math.floor(Math.random() * alphabet.length)]
  return `TD-${suffix}`
}
