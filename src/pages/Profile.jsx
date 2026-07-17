import { useEffect, useState } from 'react'
import { User, Package, MapPin, Headset, Info, Trash, Phone, ShoppingBag, Storefront, SignOut, Pencil } from '@phosphor-icons/react'
import { useCart } from '../context/Cart.jsx'
import { useCustomer, saveUserProfile, getUserProfile } from '../data/auth.js'
import { GoogleLogo } from '@phosphor-icons/react'

export default function Profile() {
  const { clear, totalQty } = useCart()
  const { user, login, register, logout, err, loginWithGoogle } = useCustomer()
  const [tab, setTab] = useState('login') // login | register
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [name, setName] = useState('')
  const [profile, setProfile] = useState(null)
  const [editing, setEditing] = useState(false)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (user?.uid) {
      getUserProfile(user.uid).then((p) => {
        if (p) { setProfile(p); setPhone(p.phone || ''); setAddress(p.address || '') }
      })
    }
  }, [user])

  async function handleLogin(e) {
    e.preventDefault()
    await login(email.trim(), pass)
  }
  async function handleRegister(e) {
    e.preventDefault()
    const ok = await register(email.trim(), pass, name.trim())
    if (ok && user) { await saveUserProfile(user.uid, { email, name: name.trim(), phone: '', address: '' }) }
  }
  async function saveProfile(e) {
    e.preventDefault()
    if (!user) return
    const data = { email: user.email, name: profile?.name || name || user.email, phone, address }
    await saveUserProfile(user.uid, data)
    setProfile(data); setEditing(false); setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const menu = [
    { icon: Package, label: 'Pesanan saya', sub: 'Lihat status & riwayat', to: '/orders' },
    { icon: MapPin, label: 'Alamat pengiriman', sub: 'Atur alamat rumah', action: () => setEditing(true) },
    { icon: Headset, label: 'Bantuan', sub: 'Hubungi customer service' },
    { icon: Info, label: 'Tentang toko', sub: 'Cerita & kebijakan' },
  ]
  const owner = [
    { icon: Storefront, label: 'Panel Admin', sub: 'Kelola produk & pesanan', to: '/admin' },
  ]

  // ----- BELUM LOGIN: form -----
  if (!user) {
    return (
      <div className="profile-wrap">
        <div className="profile-head">
          <div className="avatar">L</div>
          <div className="profile-id">
            <h1 className="profile-name">Lospecados</h1>
            <p className="profile-sub">Masuk untuk simpan alamat & pantau pesanan</p>
          </div>
        </div>

        <div className="seg">
          <button className={tab === 'login' ? 'seg-on' : ''} onClick={() => setTab('login')}>Masuk</button>
          <button className={tab === 'register' ? 'seg-on' : ''} onClick={() => setTab('register')}>Daftar</button>
        </div>

        <form className="card" onSubmit={tab === 'login' ? handleLogin : handleRegister}>
          {tab === 'register' && (
            <div className="field"><label>Nama</label><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama lengkap" /></div>
          )}
          <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@contoh.com" required /></div>
          <div className="field"><label>Password</label><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="••••••" required minLength={6} /></div>
          {err && <div className="form-err">{err}</div>}
          <button className="btn block" type="submit">{tab === 'login' ? 'Masuk' : 'Daftar'}</button>
          <button className="btn google block" type="button" onClick={loginWithGoogle}>
            <GoogleLogo size={18} weight="bold" /> Lanjut dengan Google
          </button>
        </form>
        <p className="muted center" style={{ fontSize: 12 }}>Mode demo: email & password bebas (tanpa Firebase).</p>
      </div>
    )
  }

  // ----- SUDAH LOGIN: profil -----
  return (
    <>
      <section className="profile-head">
        <div className="avatar">{(profile?.name || user.email || 'L')[0].toUpperCase()}</div>
        <div className="profile-id">
          <h1 className="profile-name">{profile?.name || user.email}</h1>
          <p className="profile-sub">{user.email}</p>
        </div>
        <button className="btn ghost sm" onClick={logout} aria-label="Keluar"><SignOut size={18} /></button>
      </section>

      {editing ? (
        <form className="card" onSubmit={saveProfile}>
          <div className="section-title" style={{ marginTop: 0 }}>Profil & Alamat</div>
          <div className="field"><label>Nama</label><input value={profile?.name || name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} /></div>
          <div className="field"><label>No. HP</label><input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="08xx-xxxx-xxxx" /></div>
          <div className="field"><label>Alamat</label><textarea value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Jl. Contoh No. 1, Kota" rows={2} /></div>
          {saved && <div className="form-ok">Tersimpan ✓</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn block" type="submit">Simpan</button>
            <button className="btn ghost" type="button" onClick={() => setEditing(false)}>Batal</button>
          </div>
        </form>
      ) : (
        <button className="card profile-edit" onClick={() => setEditing(true)}>
          <Pencil size={18} /><span>{phone || address ? `${phone} · ${address}` : 'Tambah alamat & no HP'}</span>
        </button>
      )}

      <nav className="menu" aria-label="Panel owner" style={{ marginTop: 16 }}>
        {owner.map(({ icon: Icon, label, sub, to }) => (
          <a className="menu-row" key={label} href={to}>
            <span className="menu-ico"><Icon size={22} weight="bold" /></span>
            <span className="menu-text"><span className="menu-label">{label}</span><span className="menu-sub">{sub}</span></span>
          </a>
        ))}
      </nav>

      <nav className="menu" aria-label="Menu akun">
        {menu.map(({ icon: Icon, label, sub, to, action }) => (
          <button className="menu-row" key={label} type="button" onClick={action}>
            <span className="menu-ico"><Icon size={22} weight="bold" /></span>
            <span className="menu-text"><span className="menu-label">{label}</span><span className="menu-sub">{sub}</span></span>
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
