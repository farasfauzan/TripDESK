import { NavLink, useLocation } from 'react-router-dom'
import { HomeIcon, PinIcon, SearchIcon, TicketIcon, UserIcon } from './Icons.jsx'

const items = [
  { to: '/', label: 'Beranda', icon: HomeIcon, match: ['/'] },
  { to: '/cari', label: 'Cari', icon: SearchIcon, match: ['/cari', '/jadwal', '/pesan'] },
  { to: '/armada', label: 'Peta', icon: PinIcon, match: ['/armada'] },
  { to: '/pesanan', label: 'Pesanan', icon: TicketIcon, match: ['/pesanan', '/lacak'] },
  { to: '/profil', label: 'Profil', icon: UserIcon, match: ['/profil', '/tentang'] },
]

// Cocokkan per segmen path, bukan awalan mentah: "/pesanan" jangan dianggap
// bagian dari "/pesan" (kalau pakai startsWith biasa, tab Beranda ikut nyala).
const inSection = (pathname, path) => pathname === path || pathname.startsWith(`${path}/`)

const isMatch = (pathname, item) =>
  item.match.some((path) => (path === '/' ? pathname === '/' : inSection(pathname, path)))

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
