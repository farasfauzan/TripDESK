import { localStamp } from './dates.js'

// Status yang disimpan hanya 'terjadwal' atau 'dibatalkan'. Status perjalanan
// diturunkan dari waktu sekarang supaya pesanan yang sudah lewat tidak
// selamanya tampil "Terjadwal".
export const deriveStatus = (booking, now = new Date()) => {
  if (booking.status === 'dibatalkan') return 'dibatalkan'
  const stamp = localStamp(now)
  if (stamp >= `${booking.date} ${booking.arriveTime}`) return 'selesai'
  if (stamp >= `${booking.date} ${booking.departTime}`) return 'berlangsung'
  return 'terjadwal'
}
