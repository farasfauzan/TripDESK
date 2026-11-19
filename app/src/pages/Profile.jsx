import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getProfile } from '../api.js'
import { formatDate, initials, rupiah } from '../utils.js'
import { ErrorBox, Loading } from '../components/State.jsx'
import {
  ChevronRightIcon,
  InfoIcon,
  MailIcon,
  PhoneIcon,
  PinIcon,
  TicketIcon,
  WalletIcon,
} from '../components/Icons.jsx'

const menus = [
  { id: 'about', label: 'Tentang aplikasi', hint: 'Versi, teknologi, dan pembuat', to: '/tentang', icon: InfoIcon },
  { id: 'payment', label: 'Metode pembayaran', hint: 'Segera hadir di demo ini', disabled: true, icon: WalletIcon },
  { id: 'help', label: 'Bantuan & asistensi', hint: 'Hubungi asisten pembimbing', disabled: true, icon: PhoneIcon },
]

export default function Profile() {
  const [profile, setProfile] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    getProfile(controller.signal)
      .then(setProfile)
      .catch((err) => {
        if (err.name !== 'AbortError') setError(err.message)
      })
    return () => controller.abort()
  }, [])

  return (
    <div className="page">
      <header className="page-head">
        <div>
          <p className="eyebrow">Akun saya</p>
          <h1>Profil</h1>
        </div>
      </header>

      <ErrorBox message={error} />
      {!profile && !error ? <Loading label="Memuat profil…" /> : null}

      {profile ? (
        <>
          <section className="profile-card">
            <span className="avatar is-lg">{initials(profile.name)}</span>
            <div className="profile-info">
              <h2>{profile.name}</h2>
              <p>{profile.nim} · {profile.level}</p>
              <p className="muted-small">Anggota sejak {formatDate(profile.memberSince, { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </section>

          <div className="stats-grid">
            <div className="stat">
              <TicketIcon width={18} height={18} />
              <strong>{profile.stats.totalTrip}</strong>
              <span>Perjalanan</span>
            </div>
            <div className="stat">
              <WalletIcon width={18} height={18} />
              <strong>{rupiah(profile.stats.totalSpend)}</strong>
              <span>Total belanja</span>
            </div>
            <div className="stat">
              <InfoIcon width={18} height={18} />
              <strong>{profile.stats.activeBooking}</strong>
              <span>Pesanan aktif</span>
            </div>
          </div>

          <section className="section">
            <div className="section-head">
              <h2>Kontak</h2>
            </div>
            <ul className="info-list">
              <li>
                <MailIcon width={18} height={18} />
                <span>{profile.email}</span>
              </li>
              <li>
                <PhoneIcon width={18} height={18} />
                <span>{profile.phone}</span>
              </li>
              <li>
                <PinIcon width={18} height={18} />
                <span>{profile.city}</span>
              </li>
            </ul>
          </section>

          <section className="section">
            <div className="section-head">
              <h2>Pengaturan</h2>
            </div>
            <div className="menu-list">
              {menus.map((menu) => {
                const Icon = menu.icon
                const content = (
                  <>
                    <span className="menu-icon">
                      <Icon width={18} height={18} />
                    </span>
                    <span className="menu-text">
                      <strong>{menu.label}</strong>
                      <small>{menu.hint}</small>
                    </span>
                    {menu.disabled ? <span className="chip chip-muted">Segera</span> : <ChevronRightIcon width={18} height={18} />}
                  </>
                )
                return menu.to ? (
                  <Link key={menu.id} className="menu-row" to={menu.to}>
                    {content}
                  </Link>
                ) : (
                  <button key={menu.id} type="button" className="menu-row" disabled>
                    {content}
                  </button>
                )
              })}
            </div>
          </section>

          <p className="fine-print is-center">Tripdesk v0.1.0 · dibuat untuk Tugas Akhir Praktikum PPB 2026</p>
        </>
      ) : null}
    </div>
  )
}
