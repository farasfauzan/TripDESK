-- Skema untuk data transaksi Tripdesk di Neon (Lakebase Postgres).
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

-- Kursi terpakai dihitung per jadwal + tanggal, bukan pesanan dibatalkan.
CREATE INDEX IF NOT EXISTS bookings_schedule_date_idx
  ON bookings (schedule_id, travel_date)
  WHERE status <> 'dibatalkan';

CREATE INDEX IF NOT EXISTS bookings_created_at_idx
  ON bookings (created_at DESC);
