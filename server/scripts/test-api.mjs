import assert from 'node:assert/strict'

// Smoke test alur pemesanan terhadap API yang tersambung ke Neon.
const base = process.env.API_URL ?? 'http://localhost:4000/api'
const date = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10)

const call = async (method, path, body) => {
  const response = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  const payload = await response.json()
  return { response, payload }
}

const health = await call('GET', '/health')
assert.equal(health.response.status, 200)
assert.equal(health.payload.status, 'ok')
console.log('PASS GET /health')

const before = await call('GET', '/bookings')
assert.equal(before.response.status, 200)
assert.ok(Array.isArray(before.payload.data))
console.log(`PASS GET /bookings (${before.payload.data.length} pesanan)`)

const schedules = await call('GET', `/schedules?origin=Semarang&destination=Jepara&date=${date}`)
assert.equal(schedules.response.status, 200)
const schedule = schedules.payload.data[0]
assert.ok(schedule, 'ada jadwal yang tersedia')
const detailSchedule = await call('GET', `/schedules/${schedule.id}?date=${date}`)
assert.equal(detailSchedule.response.status, 200)
const seat = detailSchedule.payload.data.seats.find((s) => !s.taken)?.no
assert.ok(seat, 'ada kursi kosong')
console.log(`PASS GET /schedules + /schedules/:id (${schedule.id}, kursi ${seat} tersedia)`)

const created = await call('POST', '/bookings', {
  scheduleId: schedule.id,
  date,
  seats: [seat],
  passenger: { name: 'Tes Neon', phone: '081234567890', email: 'tes@example.com' },
})
assert.equal(created.response.status, 201, JSON.stringify(created.payload))
const code = created.payload.data.code
assert.ok(code)
console.log(`PASS POST /bookings → ${code} tersimpan di Neon`)

const detail = await call('GET', `/bookings/${code}`)
assert.equal(detail.response.status, 200)
assert.equal(detail.payload.data.code, code)
assert.equal(detail.payload.data.seats[0], seat)
console.log(`PASS GET /bookings/${code}`)

const list = await call('GET', '/bookings')
assert.ok(list.payload.data.some((b) => b.code === code))
console.log('PASS pesanan muncul di daftar')

const taken = await call('GET', `/schedules/${schedule.id}?date=${date}`)
assert.equal(taken.response.status, 200)
assert.equal(taken.payload.data.seats.find((s) => s.no === seat).taken, true)
console.log('PASS kursi terhapus dari ketersediaan setelah dipesan')

const cancelled = await call('PATCH', `/bookings/${code}/cancel`)
assert.equal(cancelled.response.status, 200)
assert.equal(cancelled.payload.data.status, 'dibatalkan')
console.log(`PASS PATCH /bookings/${code}/cancel`)

const freed = await call('GET', `/schedules/${schedule.id}?date=${date}`)
assert.equal(freed.payload.data.seats.find((s) => s.no === seat).taken, false)
console.log('PASS kursi kembali tersedia setelah dibatalkan')

const removed = await call('DELETE', `/bookings/${code}`)
assert.equal(removed.response.status, 200)
assert.equal(removed.payload.data.deleted, true)
console.log(`PASS DELETE /bookings/${code}`)

const gone = await call('GET', `/bookings/${code}`)
assert.equal(gone.response.status, 404)
console.log('PASS pesanan hilang dari Neon')

const profile = await call('GET', '/profile')
assert.equal(profile.response.status, 200)
console.log('PASS GET /profile')

console.log('\nSemua endpoint terhubung ke Neon lolos.')
