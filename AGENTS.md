# AGENTS.md

Panduan untuk agen AI yang melanjutkan repo ini.

## Konteks

Tripdesk adalah skeleton Tugas Akhir Praktikum PPB 2026: aplikasi pemesanan tiket travel shuttle antarkota. Frontend PWA React + Vite, backend REST API Express. Semua teks UI berbahasa Indonesia.

## Perintah

```bash
# API (port 4000)
cd server && npm install && npm run dev

# PWA (port 5173, proxy /api → 4000)
cd app && npm install && npm run dev

# Verifikasi
curl -s localhost:4000/api/health
curl -s "localhost:4000/api/schedules?origin=SMG&destination=JPR&date=$(date +%F)"
cd app && npm run build
```

Tidak ada test runner. Verifikasi WAJIB dilakukan dengan menjalankan API + build, bukan hanya membaca kode.

## Konvensi

- Respons API sukses: `{ "data": ... }` (opsional `meta`). Gagal: `{ "error": { "code", "message" } }` dengan status HTTP yang tepat.
- Tanggal selalu string ISO `YYYY-MM-DD`; validasi lewat `server/src/dates.js`.
- Data seed ada di `server/src/data.js`; pesanan persisten di `server/data/bookings.json` (di-ignore git, aman dihapus untuk reset).
- Jam jemput dihitung dari jam berangkat dikurangi `offsetMinutes` titik jemput (`shiftTime` di `server/src/dates.js`), bukan disimpan manual.
- Beranda memakai peta dummy (`TravelMap.jsx`) dengan animasi transform pada marker; jangan memindahkannya ke `.page`.
- ETA + jarak armada dihitung deterministik di `server/src/eta.js` (demo, bukan GPS); jangan mengklaim sebagai pelacakan real-time.
- Cuaca di peta adalah data demo deterministik (`app/src/weather.js`), bukan API cuaca sungguhan.
- Status halaman lacak diuji lewat `cd app && npm run test:tracking`; `?at=HH:MM` hanya untuk demo status.
- Frontend: komponen di `app/src/components/`, halaman di `app/src/pages/`, satu `styles.css` dengan CSS variable (tanpa framework CSS).
- Layout mobile-first, shell maksimum 460 px; jangan menambahkan animasi `transform` pada `.page` karena merusak `position: fixed` action bar.
- Semua nominal memakai `rupiah()` dari `app/src/utils.js`.
- Animasi memakai GSAP + ScrollTrigger lewat `useGSAP`/`useReveal` di `app/src/animations.js`; hormati `prefers-reduced-motion` dan jangan animasikan transform pada `.page` (merusak fixed action bar).
- Jangan menaruh secret di repo; gunakan env (`PORT`, `VITE_API_URL`).

## Status requirement

7 ketentuan TA sudah terpenuhi di kode kecuali unggah GitHub, deploy PWA, dan asistensi. Detail ada di `docs/RENCANA.md`; jangan menandainya selesai sebelum benar-benar dilakukan.
