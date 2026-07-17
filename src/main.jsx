import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { CartProvider } from './context/Cart.jsx'
import Layout from './components/Layout.jsx'
import OwnerLayout from './components/OwnerLayout.jsx'
import Beranda from './pages/Beranda.jsx'
import Cart from './pages/Cart.jsx'
import Orders from './pages/Orders.jsx'
import Profile from './pages/Profile.jsx'
import Admin from './pages/Admin.jsx'
import Courier from './pages/Courier.jsx'
import Track from './pages/Track.jsx'
import './styles.css'

class ErrorBoundary extends React.Component {
  constructor(p) { super(p); this.state = { err: null } }
  static getDerivedStateFromError(err) { return { err } }
  componentDidCatch(err, info) { console.error('[app crash]', err, info) }
  render() {
    if (this.state.err) {
      return (
        <div style={{ padding: 24, fontFamily: 'system-ui', color: '#1B2A4A' }}>
          <h2>Terjadi kesalahan saat memuat halaman</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: 12, borderRadius: 12, fontSize: 13, color: '#b91c1c' }}>
            {String((this.state.err && this.state.err.stack) || this.state.err)}
          </pre>
          <p style={{ fontSize: 13, color: '#6B7280' }}>Buka console browser (F12) untuk detail. Atau hubungi developer.</p>
        </div>
      )
    }
    return this.props.children
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <ErrorBoundary>
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Beranda />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/profile" element={<Profile />} />
          </Route>
          <Route path="/admin" element={<Admin />} />
          <Route element={<OwnerLayout />}>
            <Route path="/courier" element={<Courier />} />
          </Route>
          <Route path="/track/:token" element={<Track />} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  </ErrorBoundary>
)
