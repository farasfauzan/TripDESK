import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'
import '../src/env.js'

const here = path.dirname(fileURLToPath(import.meta.url))
const schema = await fs.readFile(path.join(here, '..', 'db', 'schema.sql'), 'utf8')

// Migrasi memakai koneksi direct: PgBouncer (pooled) tidak mendukung SET/session state.
const connectionString = process.env.DATABASE_URL_UNPOOLED ?? process.env.DATABASE_URL
if (!connectionString) {
  throw new Error('DATABASE_URL / DATABASE_URL_UNPOOLED belum tersedia. Jalankan `neon deploy` atau `neon env pull` dulu.')
}

const client = new pg.Client({ connectionString })
try {
  await client.connect()
  await client.query(schema)
  console.log('Skema bookings siap di Neon.')
} finally {
  await client.end()
}
