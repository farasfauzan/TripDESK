import { buildTrackingView, buildTrackingSteps } from '../src/tracking/trackingView.js'

const base = {
  code: 'TD-TEST',
  status: 'terjadwal',
  date: '2026-11-19',
  origin: 'Semarang',
  destination: 'Jepara',
  departTime: '18:30',
  arriveTime: '21:00',
  pickupPoint: { id: 'SMG-2', name: 'Banyumanik (SPBU)', time: '18:15' },
  fleet: 'Toyota Hiace Premio · H 7812 TA',
  seats: [4],
  etaMinutes: 11,
  createdAt: '2026-11-19T02:30:00.000Z',
}

const at = (date, time) => new Date(`${date}T${time}:00`)

const cases = [
  {
    name: 'LIVE (sebelum jam jemput)',
    booking: base,
    now: at('2026-11-19', '09:00'),
    expect: { headline: '11 menit', chip: 'LIVE · 11 mnt', completed: 1, live: true },
  },
  {
    name: 'Armada tiba (antara jemput & berangkat)',
    booking: base,
    now: at('2026-11-19', '18:20'),
    expect: { headline: 'Armada tiba', chip: 'Armada tiba', completed: 3, live: false },
  },
  {
    name: 'Dalam perjalanan (setelah berangkat)',
    booking: base,
    now: at('2026-11-19', '19:00'),
    expect: { headline: 'Dalam perjalanan', chip: 'Dalam perjalanan', completed: 4, live: false },
  },
  {
    name: 'Selesai (setelah tiba)',
    booking: base,
    now: at('2026-11-19', '21:30'),
    expect: { headline: 'Selesai', chip: 'Selesai', completed: 5, live: false },
  },
  {
    name: 'Dibatalkan',
    booking: { ...base, status: 'dibatalkan' },
    now: at('2026-11-19', '09:00'),
    expect: { headline: 'Dibatalkan', chip: 'Dibatalkan', completed: 0, live: false },
  },
  {
    name: 'Dijadwalkan (tanggal future)',
    booking: { ...base, date: '2026-11-20' },
    now: at('2026-11-19', '09:00'),
    expect: { headline: 'Dijadwalkan', chip: 'Dijadwalkan', completed: 1, live: false },
  },
]

let failed = 0

for (const test of cases) {
  const view = buildTrackingView(test.booking, test.now)
  const steps = buildTrackingSteps(test.booking, test.now)
  const problems = []

  for (const [key, value] of Object.entries(test.expect)) {
    if (view[key] !== value) problems.push(`${key}: ${JSON.stringify(view[key])} != ${JSON.stringify(value)}`)
  }
  if (steps.length !== 5) problems.push(`steps: ${steps.length} != 5`)

  if (problems.length) {
    failed += 1
    console.log(`FAIL ${test.name}`)
    for (const problem of problems) console.log(`  - ${problem}`)
  } else {
    console.log(`PASS ${test.name} → ${view.headline} / ${view.chip}`)
  }
}

if (failed) {
  console.error(`\n${failed} test gagal`)
  process.exit(1)
}
console.log('\nSemua status lacak lolos (6 kasus).')
