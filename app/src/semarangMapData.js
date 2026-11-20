// Konstanta peta level kota. Geometri jalan/pantai/sungai TIDAK lagi digambar
// tangan — semuanya dari OpenStreetMap di `osmSemarang.js` (dibuat oleh
// scripts/fetch-osm.mjs).

export const KM_PER_UNIT = 3.35

// Titik jemput dalam km relatif pusat Semarang (+x timur, +y selatan).
// Diturunkan dari koordinat asli tiap titik.
export const pickupKm = {
  'SMG-1': { x: 2.41, y: 9.4 }, // Tembalang / UNDIP
  'SMG-2': { x: -0.08, y: 10.76 }, // Banyumanik
  'SMG-3': { x: 0.58, y: 2.41 }, // Simpang Lima
  'SMG-4': { x: 3.98, y: -1.18 }, // Krapyak / Kaligawe
}

// Label kawasan level kota (posisi km, bukan geometri).
export const cityLabels = [
  { name: 'KOTA SEMARANG', x: -1.9, y: 2.2, size: 'big' },
  { name: 'Simpang Lima', x: 0.9, y: 3.4, size: 'small' },
  { name: 'Kota Lama', x: 1.2, y: 0.4, size: 'small' },
  { name: 'Tembalang', x: 3.2, y: 9.7, size: 'small' },
  { name: 'Banyumanik', x: 0.3, y: 11.0, size: 'small' },
  { name: 'Kaligawe', x: 4.4, y: -0.9, size: 'small' },
  { name: 'Tanjung Emas', x: 1.0, y: -2.6, size: 'small' },
  { name: 'Bandara Ahmad Yani', x: -4.4, y: 1.2, size: 'small' },
  { name: 'Jatingaleh', x: -0.2, y: 7.6, size: 'small' },
  { name: 'Gunungpati', x: -3.2, y: 11.6, size: 'small' },
]
