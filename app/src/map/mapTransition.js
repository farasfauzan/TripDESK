// Menyimpan posisi kartu peta Beranda saat tombol "Pesan" ditekan, supaya
// halaman /armada bisa memulai peta dari posisi itu lalu membesar (shared
// element), bukan fade antar halaman.
const KEY = 'tripdesk:map-morph'
const MAX_AGE = 3000

export const setMapMorph = (payload) => {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...payload, at: Date.now() }))
  } catch {
    // sessionStorage penuh/diblokir: morph dilewati, navigasi tetap jalan.
  }
}

export const getMapMorph = () => {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data?.rect || Date.now() - (data.at ?? 0) > MAX_AGE) return null
    return data
  } catch {
    return null
  }
}

export const clearMapMorph = () => {
  try {
    sessionStorage.removeItem(KEY)
  } catch {
    // abaikan
  }
}

// Ambil posisi kartu peta Beranda dari DOM (dipakai tombol lain yang juga
// menuju /armada, misalnya tile "Pesan travel").
export const captureMapMorphFromDom = () => {
  const card = document.querySelector('.map-card')
  const svg = card?.querySelector('svg')
  if (!card || !svg) return false

  const rect = card.getBoundingClientRect()
  if (rect.bottom < 0 || rect.top > window.innerHeight) return false

  const box = String(svg.getAttribute('viewBox') ?? '')
    .split(' ')
    .map(Number)
  if (box.length !== 4 || box.some((value) => !Number.isFinite(value))) return false

  setMapMorph({
    rect: { x: rect.x, y: rect.y, width: rect.width, height: rect.height },
    viewBox: { x: box[0], y: box[1], w: box[2], h: box[3] },
  })
  return true
}
