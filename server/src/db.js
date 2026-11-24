import './env.js'
import { Pool } from 'pg'
import { attachDatabasePool } from '@vercel/functions'

const raw = process.env.DATABASE_URL ?? process.env.POSTGRES_URL

if (!raw) {
  throw new Error(
    'DATABASE_URL belum tersedia. Jalankan `neon deploy` / `neon env pull` di root proyek, lalu isi env var yang sama di Vercel.',
  )
}

// pg v9 mengubah arti sslmode=require (baseline baru: verify-full) dan kini
// memunculkan warning. Kita pakai verify-full sekarang juga: buang parameternya
// dari URL lalu set ssl eksplisit.
const url = new URL(raw)
const sslMode = url.searchParams.get('sslmode') ?? ''
url.searchParams.delete('sslmode')
url.searchParams.delete('uselibpqcompat')
const useSsl = ['require', 'verify-ca', 'verify-full', 'prefer'].includes(sslMode)

// serverless (Vercel): pool kecil + drain di akhir invocation supaya tidak
// kehabisan koneksi saat cold start/scale-to-zero.
export const pool = new Pool({
  connectionString: url.toString(),
  ...(useSsl ? { ssl: { rejectUnauthorized: true } } : {}),
  max: Number(process.env.PGPOOL_MAX ?? 5),
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
})

if (process.env.VERCEL) attachDatabasePool(pool)

export async function query(text, params) {
  return pool.query(text, params)
}
