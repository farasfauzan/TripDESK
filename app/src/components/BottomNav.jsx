import { NavLink, useLocation } from 'react-router-dom'
import { HomeIcon, SparkIcon, TicketIcon, UserIcon } from './Icons.jsx'

const items = [
  { to: '/', label: 'Beranda', icon: HomeIcon, match: ['/', '/cari', '/jadwal', '/pesan', '/armada'] },
  { to: '/promo', label: 'Promo', icon: SparkIcon, match: ['/promo'] },
  { to: '/pesanan', label: 'Pesanan', icon: TicketIcon, match: ['/pesanan'] },
  { to: '/profil', label: 'Profil', icon: UserIcon, match: ['/profil', '/tentang'] },
]

const isMatch = (pathname, item) => {
  if (item.to === '/') return pathname === '/' || item.match.some((path) => path !== '/' && pathname.startsWith(path))
  return item.match.some((path) => pathname === path || pathname.startsWith(`${path}/`))
}

export default function BottomNav() {
  const { pathname } = useLocation()

  return (
    <nav className="bottom-nav" aria-label="Navigasi utama">
      {items.map((item) => {
        const Icon = item.icon
        const active = isMatch(pathname, item)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={`nav-item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
    </nav>
  )
}
