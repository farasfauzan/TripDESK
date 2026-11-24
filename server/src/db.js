import './env.js'
import { Pool } from 'pg'
import { attachDatabasePool } from '@vercel/functions'

const connectionString = process.env.DATABASE_URL ?? process.env.POSTGRES_URL

if (!connectionString) {
  throw new Error(
    'DATABASE_URL belum tersedia. Jalankan `neon deploy` / `neon env pull` di root proyek, lalu isi env var yang sama di Vercel.',
  )
}

// serverless (Vercel): pool kecil + drain di akhir invocation supaya tidak
// kehabisan koneksi saat cold start/scale-to-zero.
export const pool = new Pool({
  connectionString,
  max: Number(process.env.PGPOOL_MAX ?? 5),
  idleTimeoutMillis: 10_000,
  connectionTimeoutMillis: 10_000,
})

if (process.env.VERCEL) attachDatabasePool(pool)

export async function query(text, params) {
  return pool.query(text, params)
}
