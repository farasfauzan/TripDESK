import assert from 'node:assert/strict'
import { deriveStatus } from '../src/bookingStatus.js'

const booking = {
  status: 'terjadwal',
  date: '2026-11-20',
  departTime: '15:00',
  arriveTime: '17:30',
}

// Semua waktu di bawah UTC (Z) = WIB - 7, supaya hasilnya sama di mesin mana pun.
const cases = [
  ['pagi sebelum berangkat', '2026-11-20T03:07:00Z', 'terjadwal'],
  ['tepat jam berangkat', '2026-11-20T08:00:00Z', 'berlangsung'],
  ['di tengah perjalanan', '2026-11-20T09:12:00Z', 'berlangsung'],
  ['tepat jam tiba', '2026-11-20T10:30:00Z', 'selesai'],
  ['sehari setelahnya', '2026-11-21T01:00:00Z', 'selesai'],
  ['tengah malam WIB masih tanggal 20', '2026-11-19T17:30:00Z', 'terjadwal'],
]

for (const [name, now, expect] of cases) {
  const got = deriveStatus(booking, new Date(now))
  assert.equal(got, expect, `${name}: harus ${expect}, dapat ${got}`)
  console.log(`PASS ${name} → ${got}`)
}

assert.equal(
  deriveStatus({ ...booking, status: 'dibatalkan' }, new Date('2026-11-20T10:00:00Z')),
  'dibatalkan',
)
console.log('PASS dibatalkan → dibatalkan')

console.log(`\nSemua status pesanan lolos (${cases.length + 1} kasus).`)
