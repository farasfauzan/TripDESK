// Semua jam bisnis memakai Asia/Jakarta, bukan zona mesin. Vercel menjalankan
// fungsi di UTC, jadi tanpa ini status jadwal meleset 7 jam.
const WIB = new Intl.DateTimeFormat('sv-SE', {
  timeZone: 'Asia/Jakarta',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})

// "YYYY-MM-DD HH:MM" waktu Jakarta (bisa dibandingkan sebagai string).
export const localStamp = (date = new Date()) => WIB.format(date)

export const todayIso = () => localStamp().slice(0, 10)

export const nowTime = () => localStamp().slice(11, 16)

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

// Jadwal hari ini yang jam berangkatnya sudah lewat dianggap sudah berangkat:
// jangan ditawarkan lagi, dan jangan bisa dipesan.
export const hasDeparted = (schedule, date) => date === todayIso() && schedule.departTime <= nowTime()
