import { Route, Routes } from 'react-router-dom'
import BottomNav from './shared/BottomNav.jsx'
import Home from './home/Home.jsx'
import Search from './search/Search.jsx'
import ScheduleDetail from './schedule/ScheduleDetail.jsx'
import Checkout from './checkout/Checkout.jsx'
import Orders from './orders/Orders.jsx'
import OrderDetail from './orders/OrderDetail.jsx'
import Tracking from './tracking/Tracking.jsx'
import ArmadaMap from './armada/ArmadaMap.jsx'
import Profile from './profile/Profile.jsx'
import About from './about/About.jsx'
import NotFound from './shared/NotFound.jsx'

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
