import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// Di Vercel, env var sudah disuntikkan runtime dan dotenv tidak akan menimpanya.
// Untuk `npm run dev` lokal, baca file hasil `neon deploy` / `neon env pull`.
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..')
dotenv.config({ path: path.join(root, '.env') })
