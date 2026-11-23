import { Route, Routes } from 'react-router-dom'
import BottomNav from './components/BottomNav.jsx'
import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import ScheduleDetail from './pages/ScheduleDetail.jsx'
import Checkout from './pages/Checkout.jsx'
import Orders from './pages/Orders.jsx'
import OrderDetail from './pages/OrderDetail.jsx'
import Tracking from './pages/Tracking.jsx'
import ArmadaMap from './pages/ArmadaMap.jsx'
import Profile from './pages/Profile.jsx'
import About from './pages/About.jsx'
import NotFound from './pages/NotFound.jsx'

export default function App() {
  return (
    <div className="app-shell">
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cari" element={<Search />} />
          <Route path="/jadwal/:id" element={<ScheduleDetail />} />
          <Route path="/pesan/:id" element={<Checkout />} />
          <Route path="/pesanan" element={<Orders />} />
          <Route path="/pesanan/:code" element={<OrderDetail />} />
          <Route path="/lacak/:code" element={<Tracking />} />
          <Route path="/armada" element={<ArmadaMap />} />
          <Route path="/profil" element={<Profile />} />
          <Route path="/tentang" element={<About />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <BottomNav />
    </div>
  )
}
