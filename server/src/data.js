// Sumber data statis Tripdesk: kota, rute, armada, dan jadwal keberangkatan.
// Semua data di sini adalah seed demo, bukan data operator travel sungguhan.

export const locations = [
  { id: 'SMG', city: 'Semarang', province: 'Jawa Tengah', terminal: 'Tembalang, Semarang' },
  { id: 'JPR', city: 'Jepara', province: 'Jawa Tengah', terminal: 'Terminal Jepara' },
  { id: 'KDS', city: 'Kudus', province: 'Jawa Tengah', terminal: 'Terminal Kudus' },
  { id: 'SLO', city: 'Solo', province: 'Jawa Tengah', terminal: 'Terminal Tirtonadi' },
  { id: 'YGY', city: 'Yogyakarta', province: 'DI Yogyakarta', terminal: 'Terminal Giwangan' },
  { id: 'PKL', city: 'Pekalongan', province: 'Jawa Tengah', terminal: 'Terminal Pekalongan' },
  { id: 'TGL', city: 'Tegal', province: 'Jawa Tengah', terminal: 'Terminal Tegal' },
  { id: 'KDL', city: 'Kendal', province: 'Jawa Tengah', terminal: 'Terminal Kendal' },
]

const fleets = {
  hiace: { model: 'Toyota Hiace Premio', type: 'Shuttle Seat 9', seats: 9, plate: 'H 7812 TA' },
  elf: { model: 'Isuzu Elf NLR', type: 'Shuttle Seat 12', seats: 12, plate: 'H 9034 TA' },
  staria: { model: 'Hyundai Staria', type: 'Shuttle Premium 7', seats: 7, plate: 'H 2245 TA' },
}

// offsetMinutes = berapa menit sebelum jam berangkat armada menyapa di titik jemput.
export const pickupPointsByCity = {
  SMG: [
    { id: 'SMG-1', name: 'Tembalang (depan UNDIP)', offsetMinutes: 25 },
    { id: 'SMG-2', name: 'Banyumanik (SPBU)', offsetMinutes: 15 },
    { id: 'SMG-3', name: 'Simpang Lima', offsetMinutes: 5 },
    { id: 'SMG-4', name: 'Krapyak (Kaligawe)', offsetMinutes: 0 },
  ],
  JPR: [
    { id: 'JPR-1', name: 'Terminal Jepara', offsetMinutes: 0 },
    { id: 'JPR-2', name: 'Mayong', offsetMinutes: 20 },
  ],
  KDS: [
    { id: 'KDS-1', name: 'Terminal Kudus', offsetMinutes: 0 },
    { id: 'KDS-2', name: 'UMK (Jati)', offsetMinutes: 15 },
  ],
  SLO: [
    { id: 'SLO-1', name: 'Terminal Tirtonadi', offsetMinutes: 0 },
    { id: 'SLO-2', name: 'Kartasura', offsetMinutes: 25 },
  ],
  YGY: [
    { id: 'YGY-1', name: 'Terminal Giwangan', offsetMinutes: 0 },
    { id: 'YGY-2', name: 'Malioboro', offsetMinutes: 20 },
  ],
  PKL: [{ id: 'PKL-1', name: 'Terminal Pekalongan', offsetMinutes: 0 }],
  TGL: [{ id: 'TGL-1', name: 'Terminal Tegal', offsetMinutes: 0 }],
  KDL: [
    { id: 'KDL-1', name: 'Terminal Kendal', offsetMinutes: 0 },
    { id: 'KDL-2', name: 'Weleri', offsetMinutes: 20 },
  ],
}

// Rute dua arah, jam keberangkatan harian.
const routeDefs = [
  { from: 'SMG', to: 'JPR', km: 78, minutes: 150, price: 65000, times: ['05:30', '08:00', '11:00', '15:00', '18:30'], fleet: 'hiace' },
  { from: 'JPR', to: 'SMG', km: 78, minutes: 150, price: 65000, times: ['06:00', '09:00', '13:00', '16:30'], fleet: 'hiace' },
  { from: 'SMG', to: 'KDS', km: 55, minutes: 95, price: 45000, times: ['06:15', '09:30', '13:30', '17:00'], fleet: 'elf' },
  { from: 'KDS', to: 'SMG', km: 55, minutes: 95, price: 45000, times: ['07:00', '10:30', '14:30'], fleet: 'elf' },
  { from: 'SMG', to: 'SLO', km: 100, minutes: 180, price: 75000, times: ['06:00', '10:00', '14:00', '18:00'], fleet: 'hiace' },
  { from: 'SLO', to: 'SMG', km: 100, minutes: 180, price: 75000, times: ['07:30', '12:00', '16:00'], fleet: 'hiace' },
  { from: 'SMG', to: 'YGY', km: 130, minutes: 240, price: 90000, times: ['05:00', '09:00', '13:00', '17:00'], fleet: 'staria' },
  { from: 'YGY', to: 'SMG', km: 130, minutes: 240, price: 90000, times: ['07:00', '11:00', '15:30'], fleet: 'staria' },
  { from: 'SMG', to: 'PKL', km: 95, minutes: 175, price: 70000, times: ['06:30', '12:30', '17:30'], fleet: 'elf' },
  { from: 'PKL', to: 'SMG', km: 95, minutes: 175, price: 70000, times: ['07:00', '13:00'], fleet: 'elf' },
  { from: 'SMG', to: 'TGL', km: 130, minutes: 240, price: 85000, times: ['06:00', '11:00', '16:00'], fleet: 'hiace' },
  { from: 'SMG', to: 'KDL', km: 30, minutes: 60, price: 30000, times: ['07:00', '10:00', '13:00', '16:00', '19:00'], fleet: 'elf' },
  { from: 'KDL', to: 'SMG', km: 30, minutes: 60, price: 30000, times: ['06:30', '09:30', '12:30', '15:30', '18:30'], fleet: 'elf' },
]

const bonusMinutes = (time, minutes) => {
  const [h, m] = time.split(':').map(Number)
  const total = h * 60 + m + minutes
  const hh = String(Math.floor(total / 60) % 24).padStart(2, '0')
  const mm = String(total % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

export const routes = routeDefs.map((def, index) => {
  const origin = locations.find((l) => l.id === def.from)
  const destination = locations.find((l) => l.id === def.to)
  return {
    id: `${def.from.toLowerCase()}-${def.to.toLowerCase()}`,
    code: `TD${String(index + 1).padStart(3, '0')}`,
    originId: def.from,
    destinationId: def.to,
    origin: origin.city,
    destination: destination.city,
    distanceKm: def.km,
    durationMinutes: def.minutes,
    price: def.price,
    times: def.times,
  }
})

export const schedules = routeDefs.flatMap((def, routeIndex) =>
  def.times.map((time, timeIndex) => {
    const route = routes[routeIndex]
    const fleet = fleets[def.fleet]
    return {
      id: `${route.id}-${String(timeIndex + 1).padStart(2, '0')}`,
      routeId: route.id,
      code: `${route.code}${String(timeIndex + 1).padStart(2, '0')}`,
      departTime: time,
      arriveTime: bonusMinutes(time, def.minutes),
      durationMinutes: def.minutes,
      price: def.price,
      originId: def.from,
      destinationId: def.to,
      origin: route.origin,
      destination: route.destination,
      distanceKm: def.km,
      fleet: {
        ...fleet,
        plate: fleet.plate,
      },
      seatLayout: fleet.seats,
      amenities: ['AC', 'WiFi', 'USB charging', 'Air mineral', 'Bagasi 20 kg'],
      pickupPoints: pickupPointsByCity[def.from] ?? [],
      dropPoints: pickupPointsByCity[def.to] ?? [],
    }
  }),
)

export const promos = [
  { id: 'HEMAT10', title: 'Diskon 10% rute Jawa Tengah', description: 'Berlaku untuk pemesanan Senin–Kamis, maksimal potongan Rp15.000.', badge: 'Promo' },
  { id: 'NEWUSER', title: 'Rp5.000 untuk pengguna baru', description: 'Otomatis terpakai pada pemesanan pertama.', badge: 'Baru' },
  { id: 'JEMPUT', title: 'Gratis antar titik jemput', description: 'Penjemputan dalam kota Semarang tanpa biaya tambahan.', badge: 'Fasilitas' },
]

export const profile = {
  id: 'USR-001',
  name: 'Faras Fauzan Attaqi',
  nim: '21120124140119',
  email: 'faras.fauzan@students.undip.ac.id',
  phone: '0812-3456-7890',
  city: 'Semarang',
  memberSince: '2026-11-01',
  balance: 0,
  level: 'Silver',
}
