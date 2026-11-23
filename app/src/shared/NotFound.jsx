import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="page">
      <div className="state state-empty">
        <div className="state-emoji" aria-hidden="true">
          🧭
        </div>
        <h3>Halaman tidak ditemukan</h3>
        <p>Rute yang kamu tuju tidak ada di Tripdesk. Yuk balik ke beranda.</p>
        <Link className="btn btn-primary" to="/">
          Ke beranda
        </Link>
      </div>
    </div>
  )
}
