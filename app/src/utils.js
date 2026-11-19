export const rupiah = (value) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(
    Number(value) || 0,
  )

export const todayIso = () => {
  const now = new Date()
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

export const addDays = (iso, days) => {
  const date = new Date(`${iso}T00:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export const formatDate = (iso, options = {}) => {
  if (!iso) return '-'
  const date = new Date(`${iso}T00:00:00`)
  if (Number.isNaN(date.getTime())) return iso
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    ...options,
  }).format(date)
}

export const dateLong = (iso) =>
  formatDate(iso, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export const dateShort = (iso) => formatDate(iso, { day: 'numeric', month: 'short' })

export const durationText = (minutes) => {
  const total = Number(minutes) || 0
  const hours = Math.floor(total / 60)
  const rest = total % 60
  if (!hours) return `${rest} menit`
  return rest ? `${hours} jam ${rest} menit` : `${hours} jam`
}

export const statusMeta = {
  terjadwal: { label: 'Terjadwal', tone: 'ok' },
  dibatalkan: { label: 'Dibatalkan', tone: 'muted' },
  selesai: { label: 'Selesai', tone: 'info' },
}

export const statusOf = (status) => statusMeta[status] ?? { label: status, tone: 'muted' }

export const initials = (name) =>
  String(name ?? '')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'TD'
