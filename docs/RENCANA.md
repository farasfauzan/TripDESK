# Rencana Tripdesk

Dokumen kerja Tripdesk. Status: skeleton selesai, fitur lanjutan menyusul.

## 1. Produk

**Tripdesk** adalah aplikasi pemesanan tiket travel shuttle antarkota. Penumpang bisa mencari rute, membandingkan jadwal dan harga, memilih nomor kursi, menentukan titik jemput, lalu menyimpan e-tiket digital.

Target pengguna:

- Mahasiswa dan pekerja yang rutin bepergian antarkota (Semarang–Jepara, Semarang–Solo, Semarang–Yogyakarta, dst.).
- Operator travel kecil yang butuh katalog rute dan ketersediaan kursi tanpa membangun aplikasi sendiri.

Yang membedakan dari aplikasi katalog biasa: ada transaksi (pilih kursi → pesanan → e-tiket → pembatalan), bukan sekadar daftar item.

## 2. Alur utama

```
Beranda → Cari jadwal → Detail jadwal → Pilih kursi & data penumpang → E-tiket
                                                   ↓
                                             Daftar pesanan → Detail → Batalkan
```

## 3. Requirement sheet → implementasi

Sumber: ketentuan tugas travel antarkota (7 poin).

| # | Ketentuan | Implementasi di repo | Status |
| --- | --- | --- | --- |
| 1 | API sendiri sesuai Modul 1 | `server/` Express, endpoint katalog + transaksi, seed data sendiri | ✅ |
| 2 | Bottom Navigation Bar | `app/src/components/BottomNav.jsx`, 3 tab (Beranda, Pesanan, Profil), active state | ✅ |
| 3 | Minimal 5 halaman | 11 halaman di `app/src/pages/` + 404 | ✅ |
| 4 | 2 halaman list + detail | `/cari` → `/jadwal/:id`, `/pesanan` → `/pesanan/:code` | ✅ |
| 5 | Profile/About | `/profil` dan `/tentang` | ✅ |
| 6 | Source code di GitHub | publik di [farasfauzan/TripDESK](https://github.com/farasfauzan/TripDESK) | ✅ |
| 7 | Judul unik | "Tripdesk - Tiket Travel Antarkota" belum ada duplikat di sheet | ✅ |
| — | PWA wajib deploy free hosting | manifest + service worker siap, deploy belum | ⏳ |
| — | Asistensi minimal 1× | belum dijadwalkan | ⏳ |

Catatan: kolom Bahasa/platform di sheet masih kosong. Skeleton memakai **PWA + JavaScript**; kalau ingin pindah ke React Native/Flutter, API tetap bisa dipakai ulang.

## 4. Arsitektur

```
┌──────────────────────────┐        ┌──────────────────────────────┐
│  PWA React (Vite)        │  HTTP  │  REST API Express             │
│  /  /cari  /jadwal/:id   │ ─────► │  /api/locations /routes      │
│  /pesan/:id  /pesanan    │  JSON  │  /schedules /bookings        │
│  /profil  /tentang       │ ◄───── │  /profile                     │
└──────────────────────────┘        └──────────────┬───────────────┘
                                                     │
                                        seed data + bookings.json
```

Keputusan teknis:

- **PWA** dipilih karena wajib deploy di free hosting, cepat diuji di browser, dan tetap bisa dipasang ke home screen.
- **Express + JSON** cukup untuk skeleton; tidak perlu setup database sebelum skema stabil. Migrasi ke PostgreSQL/MySQL bisa dilakukan tanpa mengubah kontrak API.
- **Kursi demo deterministik** (`hash(jadwal+tanggal)`) supaya tampilan ketersediaan konsisten tanpa data transaksi nyata, sementara kursi yang benar-benar dipesan tetap dihitung dari `bookings.json`.
- **Mobile-first 460 px** dengan bottom nav fixed meniru pola aplikasi ride-hailing, sesuai referensi "Gojek versi travel".

### Model data

- `locations`: id, kota, provinsi, terminal.
- `routes`: id, asal/tujuan, jarak, durasi, harga dasar, daftar jam.
- `schedules`: id, rute, jam berangkat/tiba, armada, layout kursi, fasilitas, titik jemput/turun.
- `bookings`: kode, jadwal, tanggal, kursi, penumpang, titik jemput, total, status.
- `profile`: data akun demo + statistik dari pesanan.

## 5. Scope skeleton (selesai)

- Katalog kota, rute, jadwal, profil.
- Pencarian berdasarkan asal, tujuan, tanggal.
- Beranda bergaya Gojek: sapaan personal, peta dummy dengan armada bergerak, badge cuaca demo, grid layanan, kartu tiket berikutnya.
- Detail jadwal dengan fasilitas, titik jemput + jam jemput, titik turun, sisa kursi.
- Funnel bergaya Gojek: satu tombol **Pesan** membuka peta diperbesar; di sana pilih tujuan, titik jemput, toggle Sekarang/Jadwalkan, lalu pilih armada terdekat yang masih kosong.
- Pemilihan kursi maksimal 6, validasi kursi terisi, form penumpang.
- Opsi jadwal penjemputan: tiap titik punya jam sendiri (jam berangkat − offset), dipilih saat checkout dan tersimpan di e-tiket.
- Pembuatan pesanan + e-tiket, salin kode, barcode dekoratif, pembatalan.
- Daftar pesanan dengan filter status.
- ETA armada di kartu armada (deterministik, `server/src/eta.js`) dan halaman lacak armada dengan peta animasi + timeline.
- Peta armada diperbesar (`/armada`): satu peta kontinu dengan zoom `viewBox` (bukan tukar frame), tiga level LOD — Pulau Jawa (rute + batas provinsi), Kota Semarang 14 km (jalan OpenStreetMap, radius 5 km, marker armada), dan Kampus Tembalang 1,6 km (jalan + bangunan + nama jalan). Tombol ＋/− menggeser level; ganti titik jemput → kamera bergeser ke titik itu.
- Uji status pelacakan otomatis: `cd app && npm run test:tracking` (6 kasus).
- Halaman profil, tentang, 404.
- PWA: manifest, ikon 192/512 + maskable, service worker app shell.
- Micro-interaction GSAP: entrance Home, scroll reveal rute/jadwal (ScrollTrigger), transisi peta armada, stagger kartu, dan timeline lacak; otomatis nonaktif saat `prefers-reduced-motion`.
- Dokumentasi API dan requirement.

## 6. Backlog berikutnya (prioritas)

1. **P0 — deploy**: deploy API + PWA, isi kolom GitHub di sheet.
2. **P0 — asistensi**: jadwalkan minimal 1× dengan asisten, isi lembar asistensi.
3. **P1 — autentikasi**: login/registrasi, pesanan terikat akun (bukan daftar global demo).
4. **P1 — pembayaran**: pilih metode, status `menunggu pembayaran` → `dibayar`, halaman instruksi.
5. **P2 — kursi real-time**: kunci kursi sementara saat checkout, rilis otomatis bila kedaluwarsa.
6. **P2 — jadwal dinamis**: jam berangkat dari operator, bukan seed statis; dukungan pulang-pergi.
7. **P3 — operator dashboard**: kelola armada, rute, harga, dan manifest penumpang.
8. **P3 — notifikasi**: e-tiket via email/WhatsApp, pengingat H-1.

## 7. Timeline (sesuai sheet)

| Tanggal | Agenda | Status |
| --- | --- | --- |
| 13–15 Nov 2026 | Pengisian judul & pilih asisten | ✅ (judul terisi, asisten Syafik Barda) |
| 13–24 Nov 2026 | Pengerjaan TA | 🔄 skeleton selesai, lanjut deploy & fitur |
| 19 Nov 2026 | Skeleton API + UI + alur pesanan | ✅ |
| 20–21 Nov 2026 | Polish UI, uji alur, perbaikan validasi | ⏳ |
| 22 Nov 2026 | Deploy API + PWA, uji di HP | ⏳ |
| 23 Nov 2026 | Asistensi + isi sheet (repo GitHub sudah diunggah 19 Nov) | ⏳ |
| 24 Nov 2026 | Buffer perbaikan | ⏳ |
| 25–28 Nov 2026 | Responsi | ⏳ |

## 8. Risiko & mitigasi

| Risiko | Dampak | Mitigasi |
| --- | --- | --- |
| Judul sama dengan praktikan lain | TA ditolak | Cek sheet sebelum protect cell; "Tripdesk" belum dipakai |
| API gratis sleep (Render) | Request pertama lambat | Tampilkan loading state (sudah ada), pertimbangkan UptimeRobot |
| Service worker menyajikan versi lama | Perubahan tidak terlihat | Naikkan `CACHE` di `sw.js` tiap rilis |
| Data pesanan hilang saat redeploy | Demo kosong | Seed ulang otomatis; dokumentasikan reset |
| Waktu asistensi mepet | Syarat TA tidak terpenuhi | Jadwalkan asistensi setelah deploy (23 Nov) |

## 9. Checklist asistensi

- [ ] Judul & platform di sheet sudah terisi (platform masih kosong).
- [x] Repo GitHub publik + README.
- [ ] API dan PWA bisa diakses online.
- [ ] Demo alur: cari → pilih kursi → e-tiket → batalkan.
- [ ] Tunjukkan 7 requirement terpenuhi.
- [ ] Isi lembar asistensi dan minta tanda tangan asisten.
