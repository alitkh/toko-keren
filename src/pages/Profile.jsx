import { User, Package, MapPin, Headset, Info, Trash, Phone, ShoppingBag, Storefront } from '@phosphor-icons/react'
import { useCart } from '../context/Cart.jsx'

export default function Profile() {
  const { clear, totalQty } = useCart()
  const menu = [
    { icon: Package, label: 'Pesanan saya', sub: 'Lihat status & riwayat' },
    { icon: MapPin, label: 'Alamat pengiriman', sub: 'Atur alamat rumah' },
    { icon: Headset, label: 'Bantuan', sub: 'Hubungi customer service' },
    { icon: Info, label: 'Tentang toko', sub: 'Cerita & kebijakan' },
  ]
  const owner = [
    { icon: Storefront, label: 'Panel Admin', sub: 'Kelola produk & pesanan', to: '/admin' },
  ]
  return (
    <>
      <section className="profile-head">
        <div className="avatar">L</div>
        <div className="profile-id">
          <h1 className="profile-name">Pengguna Lospecados</h1>
          <p className="profile-sub">Belanja snack favorit, pantau sampai tiba</p>
        </div>
      </section>

      <nav className="menu" aria-label="Panel owner" style={{ marginTop: 16 }}>
        {owner.map(({ icon: Icon, label, sub, to }) => (
          <a className="menu-row" key={label} href={to}>
            <span className="menu-ico"><Icon size={22} weight="bold" /></span>
            <span className="menu-text">
              <span className="menu-label">{label}</span>
              <span className="menu-sub">{sub}</span>
            </span>
          </a>
        ))}
      </nav>

      <nav className="menu" aria-label="Menu akun">
        {menu.map(({ icon: Icon, label, sub }) => (
          <button className="menu-row" key={label} type="button">
            <span className="menu-ico"><Icon size={22} weight="bold" /></span>
            <span className="menu-text">
              <span className="menu-label">{label}</span>
              <span className="menu-sub">{sub}</span>
            </span>
          </button>
        ))}
      </nav>

      <div className="card profile-contact">
        <div className="section-title" style={{ marginTop: 0 }}>Kontak toko</div>
        <div className="contact-row"><Phone size={18} weight="bold" /><span>WhatsApp: 08xx-xxxx-xxxx</span></div>
        <div className="contact-row"><MapPin size={18} weight="bold" /><span>Alamat: Jl. Contoh No. 1, Kota</span></div>
      </div>

      <div className="card profile-cart">
        <div className="section-title" style={{ marginTop: 0 }}>Keranjang</div>
        <div className="cart-line"><ShoppingBag size={18} weight="bold" /><span>{totalQty} item di keranjang</span></div>
        <button className="btn ghost block" style={{ marginTop: 10 }} onClick={() => { if (confirm('Kosongkan keranjang?')) clear() }}>Kosongkan keranjang</button>
      </div>
    </>
  )
}
