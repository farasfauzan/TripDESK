-- Skema untuk data transaksi Tripdesk di Neon (Postgres).
-- Jalankan dengan: npm run migrate  (memakai DATABASE_URL_UNPOOLED / koneksi direct).

CREATE TABLE IF NOT EXISTS bookings (
  code TEXT PRIMARY KEY,
  schedule_id TEXT NOT NULL,
  travel_date DATE NOT NULL,
  seats INTEGER[] NOT NULL,
  -- Status yang disimpan hanya 'terjadwal' atau 'dibatalkan'.
  -- Status 'berlangsung'/'selesai' diturunkan dari waktu di aplikasi.
  status TEXT NOT NULL DEFAULT 'terjadwal' CHECK (status IN ('terjadwal', 'dibatalkan')),
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Satu baris per kursi per jadwal + tanggal. Primary key di sini yang membuat
-- dua permintaan bersamaan tidak bisa mengambil kursi yang sama: yang kalah
-- ditolak database, bukan oleh pengecekan di aplikasi.
CREATE TABLE IF NOT EXISTS booking_seats (
  schedule_id TEXT NOT NULL,
  travel_date DATE NOT NULL,
  seat INTEGER NOT NULL,
  code TEXT NOT NULL REFERENCES bookings (code) ON DELETE CASCADE,
  PRIMARY KEY (schedule_id, travel_date, seat)
);

-- Backfill kursi untuk pesanan lama yang belum punya baris di booking_seats.
INSERT INTO booking_seats (schedule_id, travel_date, seat, code)
SELECT b.schedule_id, b.travel_date, s.seat, b.code
  FROM bookings b
  CROSS JOIN LATERAL unnest(b.seats) AS s(seat)
 WHERE b.status <> 'dibatalkan'
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS bookings_schedule_date_idx
  ON bookings (schedule_id, travel_date)
  WHERE status <> 'dibatalkan';

CREATE INDEX IF NOT EXISTS bookings_created_at_idx
  ON bookings (created_at DESC);
