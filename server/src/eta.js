// ETA demo: deterministik per (jadwal, titik jemput) supaya angka stabil.
// Bukan GPS asli — armada tidak dilacak secara runtime.
const hash = (text) => {
  let h = 2166136261
  for (let i = 0; i < text.length; i += 1) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// Estimasi armada tiba di titik jemput, 4–15 menit.
export const etaForPickup = (scheduleId, pickupPointId) =>
  4 + (hash(`${scheduleId}|${pickupPointId}`) % 12)

// Jarak demo armada ke titik jemput user, 0.4–6.3 km (di atas 5 km di luar jangkauan).
export const distanceForPickup = (scheduleId, pickupPointId) =>
  Math.round((0.4 + (hash(`${scheduleId}|${pickupPointId}|distance`) % 60) / 10) * 10) / 10

