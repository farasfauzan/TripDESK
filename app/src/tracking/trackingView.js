import { dateLong } from '../shared/utils.js'

const isoOf = (date) => {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 10)
}

const timeOf = (date, time) => new Date(`${date}T${time ?? '00:00'}:00`)

export const buildTrackingView = (booking, now = new Date()) => {
  const eta = booking.etaMinutes ?? 8
  const pickupTime = booking.pickupPoint?.time ?? booking.departTime
  const today = isoOf(now)
  const dateLabel = dateLong(booking.date)

  if (booking.status === 'dibatalkan') {
    return {
      completed: 0,
      headline: 'Dibatalkan',
      caption: 'Pesanan ini sudah dibatalkan. Kursi dilepas kembali.',
      eta: null,
      chip: 'Dibatalkan',
      live: false,
    }
  }

  if (booking.date < today) {
    return {
      completed: 5,
      headline: 'Selesai',
      caption: `Perjalanan ${dateLabel} sudah selesai.`,
      eta: null,
      chip: 'Selesai',
      live: false,
    }
  }

  if (booking.date > today) {
    return {
      completed: 1,
      headline: 'Dijadwalkan',
      caption: `${dateLabel} · jemput ${pickupTime}`,
      eta,
      chip: 'Dijadwalkan',
      live: false,
    }
  }

  const pickupAt = timeOf(booking.date, pickupTime)
  const departAt = timeOf(booking.date, booking.departTime)
  const arriveAt = timeOf(booking.date, booking.arriveTime)

  if (now >= arriveAt) {
    return {
      completed: 5,
      headline: 'Selesai',
      caption: `Tiba di ${booking.destination}.`,
      eta: null,
      chip: 'Selesai',
      live: false,
    }
  }
  if (now >= departAt) {
    return {
      completed: 4,
      headline: 'Dalam perjalanan',
      caption: `Estimasi tiba ${booking.arriveTime}.`,
      eta: null,
      chip: 'Dalam perjalanan',
      live: false,
    }
  }
  if (now >= pickupAt) {
    return {
      completed: 3,
      headline: 'Armada tiba',
      caption: `${booking.pickupPoint.name} · berangkat ${booking.departTime}`,
      eta: null,
      chip: 'Armada tiba',
      live: false,
    }
  }
  return {
    completed: 1,
    headline: `${eta} menit`,
    caption: `Armada menuju ${booking.pickupPoint.name}`,
    eta,
    chip: `LIVE · ${eta} mnt`,
    live: true,
  }
}

export const buildTrackingSteps = (booking, now = new Date()) => {
  const pickupTime = booking.pickupPoint?.time ?? booking.departTime
  const created = new Date(booking.createdAt)
  const createdLabel = Number.isNaN(created.getTime())
    ? ''
    : created.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  const future = booking.date > isoOf(now)

  return [
    { key: 'accepted', title: 'Pesanan diterima', detail: 'E-tiket diterbitkan', time: createdLabel },
    {
      key: 'approaching',
      title: `Armada menuju ${booking.pickupPoint.name}`,
      detail: future ? `Dijadwalkan ${dateLong(booking.date)}` : `Estimasi tiba ${booking.etaMinutes ?? 8} menit`,
      time: '',
    },
    {
      key: 'arrived',
      title: `Tiba di ${booking.pickupPoint.name}`,
      detail: 'Armada siap menjemput',
      time: pickupTime,
    },
    {
      key: 'departed',
      title: `Berangkat ke ${booking.destination}`,
      detail: booking.fleet,
      time: booking.departTime,
    },
    {
      key: 'arrived-dest',
      title: `Tiba di ${booking.destination}`,
      detail: 'Perjalanan selesai',
      time: booking.arriveTime,
    },
  ]
}
