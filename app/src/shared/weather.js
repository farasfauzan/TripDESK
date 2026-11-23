// Cuaca demo: deterministik per tanggal supaya tampilan stabil tanpa API eksternal.
const hash = (text) => {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const conditions = [
  { type: 'sun', label: 'Cerah' },
  { type: 'cloud', label: 'Berawan' },
  { type: 'rain', label: 'Hujan ringan' },
]

export const weatherFor = (dateIso) => {
  const key = String(dateIso ?? new Date().toISOString().slice(0, 10))
  const seed = hash(key)
  const condition = conditions[seed % conditions.length]
  return { ...condition, temp: 27 + (seed % 5) }
}
