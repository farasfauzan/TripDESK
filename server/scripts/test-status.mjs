import assert from 'node:assert/strict'
import { deriveStatus } from '../src/bookingStatus.js'

const booking = {
  status: 'terjadwal',
  date: '2026-11-20',
  departTime: '15:00',
  arriveTime: '17:30',
}

const cases = [
  ['pagi sebelum berangkat', '2026-11-20T10:07:00', 'terjadwal'],
  ['tepat jam berangkat', '2026-11-20T15:00:00', 'berlangsung'],
  ['di tengah perjalanan', '2026-11-20T16:12:00', 'berlangsung'],
  ['tepat jam tiba', '2026-11-20T17:30:00', 'selesai'],
  ['sehari setelahnya', '2026-11-21T08:00:00', 'selesai'],
]

for (const [name, now, expect] of cases) {
  const got = deriveStatus(booking, new Date(now))
  assert.equal(got, expect, `${name}: harus ${expect}, dapat ${got}`)
  console.log(`PASS ${name} → ${got}`)
}

assert.equal(
  deriveStatus({ ...booking, status: 'dibatalkan' }, new Date('2026-11-20T10:00:00')),
  'dibatalkan',
)
console.log('PASS dibatalkan → dibatalkan')

console.log(`\nSemua status pesanan lolos (${cases.length + 1} kasus).`)
