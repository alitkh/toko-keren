import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useCart } from '../context/Cart.jsx'
import { useSettings } from '../data/settings.js'
import { House, ShoppingCart, ClipboardText, User, Bell, BellRinging } from '@phosphor-icons/react'

function hasActiveOrders() {
  try {
    const orders = JSON.parse(localStorage.getItem('milstime_orders') || '[]')
    return orders.some((o) => o.status && o.status !== 'sampai')
  } catch { return false }
}

export default function Layout() {
  const { totalQty } = useCart()
  const [active, setActive] = useState(false)
  const navigate = useNavigate()
  const { settings } = useSettings()

  useEffect(() => { setActive(hasActiveOrders()) }, [])

  const brand = settings?.brandName?.split(' ') || ['mils', 'time']
  const navy = settings?.navy || '#1B2A4A'
  const orange = settings?.orange || '#FF7A1A'
  const logoEmoji = settings?.logoEmoji || '🍱'
  const logoImage = settings?.logoImage || ''

  return (
    <div className="app" style={{ '--navy': navy, '--orange': orange }}>
      <header className="topbar">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1, minWidth: 0 }}>
          <div className="brand">
            {logoImage
              ? <img src={logoImage} alt={settings?.brandName || 'logo'} style={{ width: 30, height: 30, borderRadius: 8, marginRight: 6, objectFit: 'cover' }} />
              : <span style={{ fontSize: 18, marginRight: 6 }}>{logoEmoji}</span>}
            <span className="brand-mark"><span className="brand-mils">{brand[0]}</span><span className="brand-time">{brand[1] || ''}</span><span className="brand-line" /></span>
          </div>
        </div>
        <button className="bell" onClick={() => navigate('/orders')} aria-label="Notifikasi pesanan">
          {active ? <BellRinging size={22} weight="fill" /> : <Bell size={22} />}
          {active && <span className="bell-dot" />}
        </button>
      </header>
      <main className="wrap"><Outlet /></main>
      <nav className="bottomnav">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          <House size={22} /><span>Beranda</span>
        </NavLink>
        <NavLink to="/cart" className={({ isActive }) => (isActive ? 'active' : '')}>
          <span style={{ position: 'relative', display: 'inline-flex' }}>
            <ShoppingCart size={22} />
            {totalQty > 0 && <span className="badge">{totalQty}</span>}
          </span>
          <span>Keranjang</span>
        </NavLink>
        <NavLink to="/orders" className={({ isActive }) => (isActive ? 'active' : '')}>
          <ClipboardText size={22} /><span>Pesanan</span>
        </NavLink>
        <NavLink to="/profile" className={({ isActive }) => (isActive ? 'active' : '')}>
          <User size={22} /><span>Profil</span>
        </NavLink>
      </nav>
    </div>
  )
}
