# Tripdesk

Aplikasi pemesanan tiket **travel shuttle antarkota** — pencarian rute, jadwal, pilih kursi, e-tiket, dan pembatalan. Dibuat sebagai Tugas Akhir Praktikum Pengembangan Perangkat Bergerak (PPB) 2026.

Status: **skeleton berjalan** (API + UI + alur pemesanan end-to-end), sudah diunggah ke [GitHub](https://github.com/farasfauzan/TripDESK), belum terdeploy.

- Pemilik: Faras Fauzan Attaqi — 21120124140119
- Asisten pembimbing: Syafik Barda
- Judul TA: _Tripdesk - Tiket Travel Antarkota_

## Stack

| Bagian | Teknologi |
| --- | --- |
| Frontend | React 18, React Router 6, Vite 6, GSAP 3 + ScrollTrigger (`@gsap/react`), CSS mobile-first, PWA (manifest + service worker) |
| Backend | Node.js, Express 4, REST API, penyimpanan JSON |
| Data | Seed in-memory (`server/src/data.js`) + `server/data/bookings.json` untuk pesanan |

## Struktur

```
TripDESK/
├── app/                  # PWA React + Vite
│   ├── public/           # manifest, ikon PNG/SVG, service worker
│   └── src/
│       ├── components/   # BottomNav, ScheduleCard, StatusPill, State, Icons
│       ├── pages/        # Home, Search, ScheduleDetail, Checkout, Orders,
│       │                 # OrderDetail, Profile, About, NotFound
│       ├── api.js        # klien REST API
│       ├── utils.js      # format rupiah/tanggal, status
│       └── styles.css    # design system kecil + layout mobile
├── server/               # REST API Express
│   ├── src/
│   │   ├── data.js       # seed kota, rute, armada, jadwal, promo, profil
│   │   ├── store.js      # pesanan + ketersediaan kursi
│   │   ├── dates.js      # util tanggal ISO
│   │   ├── app.js        # setup express
│   │   └── routes/       # catalog.js, bookings.js, profile.js
│   └── data/             # bookings.json (runtime, di-ignore git)
└── docs/RENCANA.md       # rencana, mapping requirement, backlog
```

## Menjalankan

Butuh Node.js 20+.

```bash
# terminal 1 — API
cd server
npm install
npm run dev          # http://localhost:4000/api

# terminal 2 — PWA
cd app
npm install
npm run dev          # http://localhost:5173
```

Vite mem-proxy `/api` ke `localhost:4000`, jadi frontend tidak butuh konfigurasi tambahan saat development.

Build produksi:

```bash
cd app
npm run build         # hasil di app/dist
npm run preview       # cek hasil build
```

Saat deploy, set `VITE_API_URL` ke URL API publik (contoh `https://tripdesk-api.onrender.com/api`) lalu build ulang. API mengaktifkan CORS untuk semua origin pada demo ini.

## Endpoint API

| Method | Endpoint | Keterangan |
| --- | --- | --- |
| GET | `/api/health` | Cek status API |
| GET | `/api/locations` | Daftar kota asal/tujuan |
| GET | `/api/pickup-points` | Titik jemput per kota asal, query `origin` |
| GET | `/api/promos` | Promo beranda |
| GET | `/api/routes` | Rute, filter `origin`, `destination`, `date` |
| GET | `/api/routes/:id` | Detail rute + jadwalnya |
| GET | `/api/schedules` | Daftar armada, filter `origin`, `destination`, `date`, `pickupPointId` (menambah `pickupTime`) |
| GET | `/api/nearby` | Armada kosong dalam radius 5 km, filter `origin`, `destination`, `date`, `pickupPointId` |
| GET | `/api/schedules/:id` | Detail jadwal + peta kursi + jam tiap titik jemput, query `date` |
| GET | `/api/bookings` | Daftar pesanan, filter `status` |
| GET | `/api/bookings/:code` | Detail e-tiket + `etaMinutes` untuk pelacakan |
| POST | `/api/bookings` | Buat pesanan |
| PATCH | `/api/bookings/:code/cancel` | Batalkan pesanan |
| GET | `/api/profile` | Profil + statistik |

Contoh membuat pesanan:

```bash
curl -X POST http://localhost:4000/api/bookings \
  -H 'Content-Type: application/json' \
  -d '{
    "scheduleId": "smg-jpr-01",
    "date": "2026-11-20",
    "seats": [3, 4],
    "passenger": { "name": "Faras Fauzan", "phone": "081234567890" },
    "pickupPointId": "SMG-1"
  }'
```

Format respons: `{ "data": ... }` untuk sukses, `{ "error": { "code", "message" } }` untuk gagal. Validasi menolak kursi di luar armada, kursi yang sudah terisi, tanggal lampau, dan nama/HP tidak valid.

## Halaman

1. **Beranda** — sapaan ala Gojek, peta dummy + lokasi user + armada bergerak + badge cuaca demo, grid layanan, tombol **Pesan**, tiket berikutnya, promo, rute favorit.
2. **Peta armada** — map diperbesar berisi lokasi user, radius 5 km, marker armada kosong, pilihan tujuan/titik jemput/Sekarang-Jadwalkan, dan daftar armada.
3. **Promo** — daftar voucher, salin kode, dan CTA pakai promo.
4. **Cari travel** — daftar armada (list #1) dengan jam jemput sesuai titik pilihan.
5. **Detail jadwal** — armada, fasilitas, titik jemput + jam jemput, titik turun, CTA pesan.
6. **Pemesanan** — pilih kursi 2+2, opsi jadwal penjemputan (jam + titik), data penumpang, ringkasan harga.
7. **Pesanan** — daftar pesanan (list #2) dengan filter status.
8. **Detail pesanan** — e-tiket + barcode, jam jemput, salin kode, batalkan.
9. **Lacak armada** — peta animasi armada, ETA, timeline perjalanan.
10. **Profil** — data akun, statistik, kontak, pengaturan.
11. **Tentang aplikasi** — versi, fitur, teknologi, pembuat.

## Checklist requirement TA

| # | Ketentuan sheet | Implementasi | Status |
| --- | --- | --- | --- |
| 1 | API (Web Service) sendiri sesuai Modul 1 | Express REST API, 12 endpoint, data seed sendiri | ✅ |
| 2 | Bottom Navigation Bar | 4 tab: Beranda, Promo, Pesanan, Profil | ✅ |
| 3 | Minimal 5 halaman | 11 halaman + halaman 404 | ✅ |
| 4 | 2 halaman list + detail | Jadwal → detail jadwal; Pesanan → detail pesanan | ✅ |
| 5 | Halaman Profile/About | `/profil` dan `/tentang` | ✅ |
| 6 | Source code di GitHub | [farasfauzan/TripDESK](https://github.com/farasfauzan/TripDESK) | ✅ |
| 7 | Judul tidak sama dengan praktikan lain | "Tripdesk" belum dipakai di sheet | ✅ |
| — | PWA deploy free hosting | Build siap, belum deploy | ⏳ |
| — | Asistensi minimal 1× + lembar asistensi | Belum dijadwalkan | ⏳ |

## Reset data demo

Hapus `server/data/bookings.json` lalu restart API. Ketersediaan kursi demo dihitung deterministik dari `(jadwal, tanggal)`, jadi tampilan akan konsisten lagi.

## Uji status pelacakan

```bash
cd app
npm run test:tracking
```

Enam kasus: LIVE, armada tiba, dalam perjalanan, selesai, dibatalkan, dan dijadwalkan. Untuk melihat status tertentu di browser tanpa menunggu jam asli, buka `/lacak/<kode>?at=HH:MM` (mode demo).

## Deploy

- **Frontend (Vercel/Netlify)**: build `app/`, output `dist/`, aktifkan SPA fallback ke `index.html`, set `VITE_API_URL`.
- **API (Render/Railway/Fly.io)**: jalankan `server/`, start command `npm start`, set `PORT` bila diperlukan.
- PWA harus diakses lewat HTTPS agar service worker dan install prompt aktif.

Detail rencana dan backlog ada di [docs/RENCANA.md](docs/RENCANA.md).
