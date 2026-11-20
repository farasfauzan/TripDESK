export const todayIso = () => new Date().toISOString().slice(0, 10)

// Validasi tanggal ISO sekaligus menolak tanggal mustahil seperti 2026-02-31.
export const isIsoDate = (value) => {
  const text = String(value ?? '')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(text)) return false
  const date = new Date(`${text}T00:00:00Z`)
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === text
}

// Geser jam "HH:MM" sebanyak delta menit, dibungkus dalam satu hari.
export const shiftTime = (time, delta) => {
  const [hours, minutes] = String(time).split(':').map(Number)
  const total = (((hours * 60 + minutes + delta) % 1440) + 1440) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

// Waktu lokal "YYYY-MM-DD HH:MM" supaya bisa dibandingkan langsung (string)
// dengan tanggal + jam jadwal. Dipakai untuk menurunkan status perjalanan.
export const localStamp = (date = new Date()) => {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`
}
