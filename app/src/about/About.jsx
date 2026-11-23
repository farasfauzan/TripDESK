import { Link, useNavigate } from 'react-router-dom'
import { CheckIcon, ChevronLeftIcon } from '../shared/Icons.jsx'

const features = [
  'REST API buatan sendiri (Express)',
  'Bottom navigation bar 3 tab',
  '10 halaman: beranda, peta armada, cari, detail jadwal, pemesanan, pesanan, detail pesanan, lacak armada, profil, tentang',
  '2 daftar utama dengan halaman detail: jadwal travel & pesanan',
  'Halaman profil dan tentang aplikasi',
  'Bisa dipasang sebagai PWA di layar utama',
]

const stack = ['React 18', 'Vite', 'React Router', 'GSAP + ScrollTrigger', 'Express', 'REST API', 'PWA']

export default function About() {
  const navigate = useNavigate()

  return (
    <div className="page about">
      <div className="detail-head">
        <button type="button" className="icon-btn" onClick={() => navigate(-1)} aria-label="Kembali">
          <ChevronLeftIcon />
        </button>
        <h1>Tentang aplikasi</h1>
        <span className="icon-btn is-ghost" aria-hidden="true" />
      </div>

      <section className="about-hero">
        <span className="app-mark" aria-hidden="true">
          <img src="/icon.svg" alt="" width="56" height="56" />
        </span>
        <h2>Tripdesk</h2>
        <p>Tiket travel shuttle antarkota dalam satu genggaman.</p>
        <span className="chip chip-ok">Versi 0.1.0 · skeleton</span>
      </section>

      <section className="about-card">
        <h3>Tentang</h3>
        <p>
          Tripdesk membantu penumpang mencari rute travel shuttle antarkota, membandingkan jadwal dan
          harga, memilih kursi, lalu menyimpan e-tiket digital. Untuk operator, data armada, titik
          jemput, dan ketersediaan kursi disajikan lewat API yang sama.
        </p>
      </section>

      <section className="about-card">
        <h3>Fitur saat ini</h3>
        <ul className="feature-list">
          {features.map((feature) => (
            <li key={feature}>
              <CheckIcon width={16} height={16} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="about-card">
        <h3>Teknologi</h3>
        <div className="chip-row">
          {stack.map((item) => (
            <span className="chip" key={item}>
              {item}
            </span>
          ))}
        </div>
      </section>

      <section className="about-card">
        <h3>Pembuat</h3>
        <p className="about-dev">
          <strong>Faras Fauzan Attaqi</strong>
          <span>NIM 21120124140119 · Teknik Komputer, Universitas Diponegoro</span>
        </p>
      </section>

      <section className="about-card is-muted">
        <h3>Catatan pengembangan</h3>
        <p>
          Versi ini adalah kerangka (skeleton): alur pencarian, pemesanan, dan pembatalan sudah
          terhubung ke API, sementara autentikasi dan payment gateway belum disertakan.
        </p>
      </section>

      <Link className="btn btn-ghost btn-block" to="/profil">
        Kembali ke profil
      </Link>
    </div>
  )
}
