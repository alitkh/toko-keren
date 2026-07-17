import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { Storefront, Motorcycle, MapPin, ArrowLeft } from '@phosphor-icons/react'

export default function OwnerLayout() {
  const navigate = useNavigate()
  return (
    <div className="app">
      <header className="topbar">
        <button className="btn ghost sm" onClick={() => navigate('/')} aria-label="Kembali ke toko" style={{ marginRight: 8 }}>
          <ArrowLeft size={18} />
        </button>
        <div className="brand"><span className="brand-mark"><span className="brand-mils">mils</span><span className="brand-time">time</span><span className="brand-line" /></span></div>
        <span className="owner-tag">Panel</span>
      </header>
      <main className="wrap"><Outlet /></main>
      <nav className="bottomnav">
        <NavLink to="/admin" end className={({ isActive }) => (isActive ? 'active' : '')}>
          <Storefront size={22} /><span>Admin</span>
        </NavLink>
        <NavLink to="/" className={({ isActive }) => (isActive ? 'active' : '')}>
          <MapPin size={22} /><span>Toko</span>
        </NavLink>
      </nav>
    </div>
  )
}
