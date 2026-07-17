import { useEffect, useState, useRef } from 'react'
import { auth, signInWithEmailAndPassword, signOut, db, collection, doc, getDocs, addDoc, updateDoc, deleteDoc, setDoc, onSnapshot } from '../firebase.js'
import { demo } from '../data/demoStore.js'
import { useCategories, addCategory, updateCategory, deleteCategory } from '../data/categories.js'
import { useBanners, addBanner, deleteBanner } from '../data/banners.js'
import { useSettings, saveSettings } from '../data/settings.js'
import { uploadImage } from '../firebase.js'
import ImageUpload from '../components/ImageUpload.jsx'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { House, Package, Images, User, SignOut, Bell, MagnifyingGlass, Plus, PencilSimple, Trash, FloppyDisk, ShoppingBag, Money, ChartLineUp, Users, Storefront, Tag, Sparkle, CaretDown, DotsThree, X, ArrowLeft, CloudArrowUp, MapPin, List, ClipboardText } from '@phosphor-icons/react'

const TABS = [
  { id: 'dashboard', label: 'Dashboard', icon: House },
  { id: 'pesanan', label: 'Pesanan', icon: ClipboardText },
  { id: 'peta', label: 'Peta', icon: MapPin },
  { id: 'produk', label: 'Produk', icon: Package },
  { id: 'menu', label: 'Menu', icon: List },
]

export default function Admin() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [tab, setTab] = useState('dashboard')
  const [products, setProducts] = useState([])
  const [orders, setOrders] = useState([])
  const adminMapRef = useRef(null)

  // Admin live map: markers for orders being delivered
  useEffect(() => {
    if (tab !== 'peta' || adminMapRef.current) return
    const el = document.getElementById('admin-map')
    if (!el) return
    adminMapRef.current = L.map(el, { zoomControl: false }).setView([-6.2, 106.8], 12)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(adminMapRef.current)
    orders.filter((o) => o.lat && o.status === 'dikirim').forEach((o) => {
      L.marker([o.lat, o.lng]).addTo(adminMapRef.current).bindPopup('#' + (o.token || o.id))
    })
    return () => { if (adminMapRef.current) { adminMapRef.current.remove(); adminMapRef.current = null } }
  }, [tab, orders])
  const [couriers, setCouriers] = useState([])
  const [p, setP] = useState({ name: '', price: 0, stock: 0, desc: '', emoji: '📦', image: '', images: [], cat: 'Makanan', disc: 0, flash: false, flashDisc: 0, active: true })
  const [c, setC] = useState({ name: '', emoji: '📦', image: '', active: true })
  const [showCatForm, setShowCatForm] = useState(false)
  const [b, setB] = useState({ title: '', subtitle: '', emoji: '🎉', color: 'linear-gradient(135deg,#1B2A4A,#FF7A1A)' })
  const { cats } = useCategories()
  const { banners } = useBanners()
  const { settings } = useSettings()
  const [s, setS] = useState({ brandName: 'Toko Keren', logoEmoji: '🛒', logoImage: '', navy: '#1B2A4A', orange: '#FF7A1A', flashOn: false, flashEnd: '', qrisUrl: '' })
  const [loginErr, setLoginErr] = useState('')
  const [prodFilter, setProdFilter] = useState('all')
  const [prodSearch, setProdSearch] = useState('')
  const [menuFor, setMenuFor] = useState(null)
  const [flashFor, setFlashFor] = useState(null)
  const [searchOpen, setSearchOpen] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [notice, setNotice] = useState(null)
  const noticeTimer = useRef(null)
  function notify(msg, type = 'ok') {
    setNotice({ msg, type })
    if (noticeTimer.current) clearTimeout(noticeTimer.current)
    noticeTimer.current = setTimeout(() => setNotice(null), 2600)
  }

  useEffect(() => { if (settings) setS(settings) }, [settings])

  useEffect(() => {
    demo.init()
    if (db) return auth.onAuthStateChanged((u) => setUser(u))
    setUser(demo.currentUser())
  }, [])

  useEffect(() => {
    if (db && user) {
      const unsubP = onSnapshot(collection(db, 'products'), (s) => setProducts(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
      const unsubO = onSnapshot(collection(db, 'orders'), (s) => setOrders(s.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))))
      const unsubC = onSnapshot(collection(db, 'couriers'), (s) => setCouriers(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
      return () => { unsubP(); unsubO(); unsubC() }
    }
    if (!db) {
      setProducts(demo.getProducts())
      setOrders(demo.getOrders().slice().reverse())
      setCouriers(demo.getCouriers())
    }
  }, [user])

  async function login(e) {
    e.preventDefault(); setLoginErr('')
    if (db) {
      try { await signInWithEmailAndPassword(auth, email, pass) }
      catch (err) { setLoginErr((err?.code || '').replace('auth/', '') || err?.message || 'Login gagal') }
    } else setUser(demo.login(email || 'admin@demo'))
  }
  function logout() { if (db) signOut(auth); else { demo.logout(); setUser(null) } }

  async function saveProduct(e) {
    e.preventDefault()
    try {
      const data = { name: p.name, price: +p.price, stock: +p.stock, desc: p.desc, emoji: p.emoji, image: p.image, images: p.images || [], cat: p.cat, disc: Number(p.disc) || 0, flash: !!p.flash, flashDisc: Number(p.flashDisc) || 0, active: p.active !== false }
      if (db) { if (p.id) await updateDoc(doc(db, 'products', p.id), data); else await addDoc(collection(db, 'products'), data) }
      else { demo.saveProduct(data); setProducts(demo.getProducts()) }
      setP({ name: '', price: 0, stock: 0, desc: '', emoji: '📦', image: '', images: [], cat: 'Makanan', disc: 0, flash: false, flashDisc: 0, active: true }); setShowForm(false)
      notify(p.id ? 'Produk diperbarui' : 'Produk ditambah')
    } catch (err) { notify('Gagal simpan produk: ' + (err?.message || err), 'err') }
  }
  function openFlash(pr) { setFlashFor({ ...pr }) }
  async function saveFlash() {
    try {
      const data = { flash: !!flashFor.flash, flashDisc: Number(flashFor.flashDisc) || 0 }
      if (db && flashFor.id) await updateDoc(doc(db, 'products', flashFor.id), data)
      else { demo.saveProduct({ ...flashFor, ...data }); setProducts(demo.getProducts()) }
      setFlashFor(null)
      notify('Pengaturan flash sale tersimpan')
    } catch (err) { notify('Gagal simpan flash: ' + (err?.message || err), 'err') }
  }
  function openAdd() { setP({ name: '', price: 0, stock: 0, desc: '', emoji: '📦', image: '', images: [], cat: 'Makanan', disc: 0, flash: false, flashDisc: 0, active: true }); setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  function edit(prod) { setP({ ...prod, active: prod.active !== false }); setShowForm(true); setTab('produk'); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  async function del(id) {
    try {
      const prod = products.find((x) => x.id === id)
      const pics = [prod && prod.image, ...(prod && prod.images || [])].filter(Boolean)
      await Promise.allSettled(pics.map((u) => fetch('/api/delete-image', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url: u }) })))
      if (db) await deleteDoc(doc(db, 'products', id))
      else { demo.deleteProduct(id); setProducts(demo.getProducts()) }
      notify('Produk dihapus')
    } catch (err) { notify('Gagal hapus: ' + (err?.message || err), 'err') }
  }

  async function uploadMore(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    const room = 5 - (p.images?.length || 0)
    const slice = files.slice(0, Math.max(0, room))
    for (const file of slice) {
      try {
        const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
        const url = await uploadImage(file, `products/${Date.now()}_${safe}`)
        setP((prev) => ({ ...prev, images: [...(prev.images || []), url] }))
      } catch (_) { /* abaikan gagal per-file */ }
    }
    if (e.target) e.target.value = ''
  }
  function removeImage(i) { setP((prev) => ({ ...prev, images: (prev.images || []).filter((_, idx) => idx !== i) })) }

  async function saveCat(e) {
    e.preventDefault(); if (!c.name) return
    try {
      if (c.id) { await updateCategory(c.id, { name: c.name, emoji: c.emoji, image: c.image || '', active: c.active }); notify('Kategori diperbarui') }
      else { await addCategory({ name: c.name, emoji: c.emoji, image: c.image || '', active: c.active }); notify('Kategori ditambah') }
      setC({ name: '', emoji: '📦', image: '', active: true }); setShowCatForm(false)
    } catch (err) { notify('Gagal simpan kategori: ' + (err?.message || err), 'err') }
  }
  function editCategory(k) { setC({ id: k.id, name: k.name, emoji: k.emoji || '📦', image: k.image || '', active: k.active !== false }); setShowCatForm(true); setTab('kategori') }
  async function delCategory(id) {
    try { await deleteCategory(id); notify('Kategoi dihapus') } catch (err) { notify('Gagal hapus: ' + (err?.message || err), 'err') }
  }
  async function saveBan(e) {
    e.preventDefault(); if (!b.title) return
    try {
      if (db) await addBanner({ title: b.title, subtitle: b.subtitle, emoji: b.emoji, color: b.color, image: b.image })
      notify('Banner ditambah')
      setB({ title: '', subtitle: '', emoji: '🎉', color: 'linear-gradient(135deg,#1B2A4A,#FF7A1A)' })
    } catch (err) { notify('Gagal tambah banner: ' + (err?.message || err), 'err') }
  }
  async function saveAppearance(e) {
    e.preventDefault(); if (!db) { notify('Mode demo: simpan hanya berlaku di sesi ini', 'err'); return }
    try { await saveSettings(s); notify('Tampilan toko tersimpan') } catch (err) { notify('Gagal simpan tampilan: ' + (err?.message || err), 'err') }
  }

  const brand = (s.brandName || 'mils time').split(' ')
  const totalRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0)
  const soldQty = orders.reduce((sum, o) => sum + (o.items || []).reduce((a, i) => a + (i.qty || 0), 0), 0)
  const activeOrders = orders.filter((o) => o.status && o.status !== 'sampai').length
  const recentOrders = orders.slice(0, 5)

  if (!user) return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="brand"><span className="brand-mark"><span className="brand-mils">{brand[0]}</span><span className="brand-time">{brand[1] || ''}</span><span className="brand-line" /></span></div>
        <h2>Masuk Admin</h2>
        <p className="login-sub">Kelola toko {s.brandName}</p>
        <form onSubmit={login}>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@milstime.com" /></div>
          <div className="field"><label>Password</label><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="password" /></div>
          <button className="btn block" type="submit">Masuk</button>
          {loginErr && <div className="login-err">Gagal login: {loginErr}</div>}
        </form>
      </div>
    </div>
  )

  const countAll = products.length
  const countAktif = products.filter((pr) => pr.active !== false && pr.stock > 0).length
  const countHabis = products.filter((pr) => pr.active !== false && pr.stock <= 0).length
  const countNonaktif = products.filter((pr) => pr.active === false).length

  const countFlash = products.filter((pr) => pr.flash).length

  const filteredProducts = products.filter((pr) => {
    const matchQ = !prodSearch || (pr.name || '').toLowerCase().includes(prodSearch.toLowerCase())
    const status = pr.active === false ? 'nonaktif' : (pr.stock > 0 ? 'aktif' : 'habis')
    if (prodFilter === 'aktif') return matchQ && status === 'aktif'
    if (prodFilter === 'habis') return matchQ && status === 'habis'
    if (prodFilter === 'flash') return matchQ && pr.flash
    if (prodFilter === 'nonaktif') return matchQ && status === 'nonaktif'
    return matchQ
  })

  return (
    <div className="app owner-app">
      {/* ============ DASHBOARD ============ */}
      {tab === 'dashboard' && (
        <>
          <div className="ad-top">
            <div>
              <h1>Dashboard</h1>
              <div className="hi">Selamat datang, Admin</div>
            </div>
            <div className="ico">
              <button aria-label="Notifikasi"><Bell size={20} /></button>
            </div>
          </div>

          <div className="sum-head"><span>Ringkasan Toko</span><CaretDown size={18} weight="bold" /></div>
          <div className="summary">
            <div className="sum"><div className="top"><span className="lbl">Total Pesanan</span><span className="ic"><ShoppingBag size={18} /></span></div><div className="num">{orders.length}</div><div className="delta up">▲ 4% dari kemarin</div></div>
            <div className="sum"><div className="top"><span className="lbl">Total Pendapatan</span><span className="ic"><Money size={18} /></span></div><div className="num">Rp {totalRevenue.toLocaleString('id-ID')}</div><div className="delta up">▲ 4% dari kemarin</div></div>
            <div className="sum"><div className="top"><span className="lbl">Produk Terjual</span><span className="ic"><Package size={18} /></span></div><div className="num">{soldQty}</div><div className="delta up">▲ 4% dari kemarin</div></div>
            <div className="sum"><div className="top"><span className="lbl">Pengunjung</span><span className="ic"><Users size={18} /></span></div><div className="num">1.250</div><div className="delta up">▲ 4% dari kemarin</div></div>
          </div>

          <div className="chart-card">
            <div className="chead"><b>Grafik Pendapatan</b><button className="see-all" onClick={() => setTab('produk')}>Lihat Semua</button></div>
            <svg className="chart-svg" viewBox="0 0 300 130" preserveAspectRatio="none">
              <defs>
                <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={s.orange || '#FF7A1A'} stopOpacity="0.18" />
                  <stop offset="100%" stopColor={s.orange || '#FF7A1A'} stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0,1,2,3,4].map((i) => <line key={i} x1="0" y1={10 + i*28} x2="300" y2={10 + i*28} stroke="#f0f1f3" strokeWidth="1" />)}
              <polygon fill="url(#area)" points="0,95 40,72 80,80 120,52 160,60 200,34 240,42 300,18 300,120 0,120" />
              <polyline fill="none" stroke={s.orange || '#FF7A1A'} strokeWidth="2.5" points="0,95 40,72 80,80 120,52 160,60 200,34 240,42 300,18" />
              {[0,1,2,3,4,5,6,7].map((i) => <circle key={i} cx={i*42.8} cy={[95,72,80,52,60,34,42,18][i]} r="3" fill="#fff" stroke={s.orange || '#FF7A1A'} strokeWidth="2" />)}
            </svg>
            <div className="chart-axis"><span>12 Mei</span><span>18 Mei</span></div>
          </div>

          <div className="recent">
            <div className="rhead"><b>Pesanan Terbaru</b><button className="see-all" onClick={() => setTab('produk')}>Lihat Semua</button></div>
            {recentOrders.length === 0 && <div className="empty"><div className="big">📭</div>Belum ada pesanan.</div>}
            {recentOrders.map((o) => (
              <div className="ritem" key={o.id || o.token}>
                <div className="l">
                  <div className="id">#{o.token}</div>
                  <div className="dt">{o.status === 'diproses' || o.status === 'menunggu' ? '18 Mei 2025, 10:21' : (o.customerName || 'Pelanggan')}</div>
                </div>
                <div className="r"><div className="st diproses">{o.status || 'menunggu'}</div><div className="pr">Rp {(Number(o.total) || 0).toLocaleString('id-ID')}</div></div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ============ PRODUK ============ */}
      {tab === 'produk' && (
        <>
          <div className="prod-head">
            <h1>Produk</h1>
            <div className="prod-head-actions">
              <button className="ph-ico" aria-label="Cari" onClick={() => setSearchOpen((v) => !v)}><MagnifyingGlass size={20} /></button>
              <button className="prod-add" onClick={openAdd}><Plus size={16} /> Tambah</button>
            </div>
          </div>

          {searchOpen && (
            <div className="prod-search-open">
              <MagnifyingGlass size={18} />
              <input autoFocus placeholder="Cari produk" value={prodSearch} onChange={(e) => setProdSearch(e.target.value)} onBlur={() => !prodSearch && setSearchOpen(false)} />
              {prodSearch && <button className="pclear" aria-label="Bersihkan" onClick={() => setProdSearch('')}><X size={16} /></button>}
            </div>
          )}

          <div className="pfilters">
            {[{ id: 'all', l: 'Semua', n: countAll }, { id: 'aktif', l: 'Aktif', n: countAktif }, { id: 'habis', l: 'Stok Habis', n: countHabis }, { id: 'flash', l: 'Flash Sale', n: countFlash }, { id: 'nonaktif', l: 'Nonaktif', n: countNonaktif }].map((f) => (
              <button key={f.id} className={prodFilter === f.id ? 'on' : ''} onClick={() => setProdFilter(f.id)}>{f.l}<span className="pcount">{f.n}</span></button>
            ))}
          </div>

          {showForm && (
            <div className="edit-screen">
              <div className="edit-top">
                <button className="edit-back" aria-label="Kembali" onClick={() => setShowForm(false)}><ArrowLeft size={22} /></button>
                <div className="edit-title">
                  <h1>{p.id ? 'Edit Produk' : 'Tambah Produk'}</h1>
                  <div className="edit-sub">{p.id ? 'Ubah informasi produk' : 'Isi informasi produk'}</div>
                </div>
              </div>

              <div className="edit-body">
                <div className="edit-block">
                  <div className="eb-head">Foto Produk</div>
                  <div className="eb-sub">Upload foto utama produk</div>
                  <div className="photo-main">
                    {p.image ? (
                      <div className="photo-main-img" style={{ backgroundImage: `url(${p.image})` }}>
                        <button type="button" className="photo-x" aria-label="Hapus foto" onClick={() => setP({ ...p, image: '' })}><X size={14} /></button>
                      </div>
                    ) : (
                      <label className="photo-main-add">
                        <CloudArrowUp size={26} />
                        <span>Upload foto utama</span>
                        <input type="file" accept="image/*" hidden onChange={async (e) => {
                          const f = e.target.files && e.target.files[0]
                          if (!f) return
                          try { const safe = f.name.replace(/[^a-zA-Z0-9._-]/g, '_'); const url = await uploadImage(f, `products/${Date.now()}_${safe}`); setP({ ...p, image: url }) } catch (_) {}
                          e.target.value = ''
                        }} />
                      </label>
                    )}
                  </div>

                  <div className="thumb-row">
                    {(p.images || []).map((src, i) => (
                      <div className="thumb" key={i} style={{ backgroundImage: `url(${src})` }}>
                        <button type="button" className="thumb-x" aria-label="Hapus" onClick={() => removeImage(i)}><X size={12} /></button>
                      </div>
                    ))}
                    {(p.images || []).length < 5 && (
                      <label className="thumb thumb-add">
                        <Plus size={20} />
                        <input type="file" accept="image/*" multiple hidden onChange={uploadMore} />
                      </label>
                    )}
                  </div>

                  <label className="upload-more">
                    <CloudArrowUp size={20} />
                    <div><div className="um-title">Upload foto lainnya</div><div className="um-meta">JPG, PNG (maks. 5MB) · Maksimal 5 foto</div></div>
                    <input type="file" accept="image/*" multiple hidden onChange={uploadMore} />
                  </label>
                </div>

                <div className="edit-block">
                  <div className="field">
                    <label>Nama Produk</label>
                    <input value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} placeholder="Nama produk" />
                  </div>
                  <div className="field">
                    <label>Kategori</label>
                    <select value={p.cat} onChange={(e) => setP({ ...p, cat: e.target.value })}>
                      {(cats.length ? cats : [{ name: 'Makanan' }, { name: 'Minuman' }, { name: 'Snack' }, { name: 'Sayur' }, { name: 'Dessert' }]).map((k) => <option key={k.name} value={k.name}>{k.name}</option>)}
                    </select>
                  </div>
                  <div className="field-row">
                    <div className="field"><label>Harga</label>
                      <div className="price-wrap"><span className="rp">Rp</span><input type="number" value={p.price} onChange={(e) => setP({ ...p, price: e.target.value })} placeholder="0" /></div>
                    </div>
                    <div className="field"><label>Stok</label><input type="number" value={p.stock} onChange={(e) => setP({ ...p, stock: e.target.value })} placeholder="0" /></div>
                    <div className="field"><label>Diskon (%)</label><input type="number" value={p.disc || 0} onChange={(e) => setP({ ...p, disc: e.target.value })} placeholder="0" /></div>
                  </div>
                  <div className="field">
                    <label>Deskripsi Produk</label>
                    <textarea rows={4} value={p.desc} onChange={(e) => setP({ ...p, desc: e.target.value })} placeholder="Tulis deskripsi produk di sini..." />
                  </div>
                </div>

                <div className="edit-block">
                  <div className="status-row">
                    <div><div className="st-label">Status Produk</div><div className="st-sub">{p.active !== false ? 'Aktif' : 'Nonaktif'}</div></div>
                    <button type="button" className={'toggle' + (p.active !== false ? ' on' : '')} role="switch" aria-checked={p.active !== false} onClick={() => setP({ ...p, active: !(p.active !== false) })}><span className="knob" /></button>
                  </div>
                </div>
              </div>

              <div className="edit-foot">
                <button className="btn ghost block" type="button" onClick={() => setShowForm(false)}>Batal</button>
                <button className="btn block orange" type="button" onClick={saveProduct}><FloppyDisk size={16} /> {p.id ? 'Simpan Produk' : 'Tambah Produk'}</button>
              </div>
            </div>
          )}

          <div className="plist2">
            {filteredProducts.map((pr) => {
              const status = pr.active === false ? 'nonaktif' : (pr.stock > 0 ? 'aktif' : 'habis')
              const statusLabel = status === 'aktif' ? 'Aktif' : status === 'habis' ? 'Stok Habis' : 'Nonaktif'
              return (
                <div className="prow2" key={pr.id}>
                  {pr.image ? <img className="pic" src={pr.image} alt={pr.name} /> : <div className="pic">{pr.emoji || '📦'}</div>}
                  <div className="info">
                    <div className="nm">{pr.name}</div>
                    <div className="meta">Rp {pr.price?.toLocaleString('id-ID')}</div>
                    <div className="meta">Stok: {pr.stock}</div>
                  </div>
                  <div className={`st ${status}`}>{statusLabel}</div>
                  <div className="acts" style={{ position: 'relative' }}>
                    <button className="pkebab" aria-label="Menu" onClick={() => setMenuFor(menuFor === pr.id ? null : pr.id)}><DotsThree size={20} weight="bold" /></button>
                    {menuFor === pr.id && (
                      <div className="menu-pop">
                        <button onClick={() => { setMenuFor(null); setFlashFor(pr) }}><Tag size={15} /> Flash Sale</button>
                        <button onClick={() => { setMenuFor(null); edit(pr) }}><PencilSimple size={15} /> Edit</button>
                        <button className="del" onClick={() => { setMenuFor(null); del(pr.id) }}><Trash size={15} /> Hapus</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
            {filteredProducts.length === 0 && <div className="empty"><div className="big">📦</div>Tidak ada produk.</div>}
          </div>
        </>
      )}

      {/* ============ KONTEN ============ */}
      {/* ============ PESANAN ============ */}
      {tab === 'pesanan' && (
        <div className="ad-pad">
          <div className="section-title">Daftar Pesanan ({orders.length})</div>
          {orders.map((o) => (
            <div className="order" key={o.token || o.id}>
              <div className="head"><b>#{o.token || o.id}</b><span className={`tag ${o.status}`}>{o.status}</span></div>
              <div className="items">{o.items?.map((i) => i.name + ' x' + i.qty).join(', ')}</div>
              <div className="items">{o.customerName} • {o.phone}</div>
              <div className="items">Metode: {o.method?.toUpperCase()} {o.method === 'cod' && o.codReceived ? '• COD Diterima' : ''}</div>
              <div className="items">{o.addressLabel}: {o.address}</div>
              {o.lat && <div className="items">Pin: {o.lat.toFixed(4)}, {o.lng.toFixed(4)}</div>}
            </div>
          ))}
          {orders.length === 0 && <div className="empty"><div className="big">📋</div>Belum ada pesanan.</div>}
        </div>
      )}

      {/* ============ PETA ============ */}
      {tab === 'peta' && (
        <div className="ad-pad">
          <div className="section-title">Peta Kurir Aktif</div>
          <div id="admin-map" style={{ height: 320, borderRadius: 12 }} />
          <div className="muted" style={{ fontSize: 12, marginTop: 8 }}>Menampilkan posisi kurir yang sedang bertugas (real-time).</div>
        </div>
      )}

      {tab === 'menu' && (
        <>
          <div className="ad-pad" />
          <div className="cat-page">
            <div className="cat-head">
              <h1>Kategori</h1>
              <p>Kelola kategori produk di toko Anda</p>
            </div>
            <button className="cat-add" onClick={() => { setC({ name: '', emoji: '📦', image: '', active: true }); setShowCatForm(true) }}><Plus size={18} /> Tambah Kategori</button>
            <div className="cat-list">
              {cats.map((k) => (
                <div className="cat-row" key={k.id} onClick={() => editCategory(k)}>
                  <div className="cat-thumb">{k.image ? <img src={k.image} alt={k.name} /> : <span>{k.emoji}</span>}</div>
                  <div className="cat-info">
                    <div className="cat-name">{k.name}</div>
                    <div className="cat-count">{products.filter((x) => x.cat === k.name).length} Produk</div>
                  </div>
                  <button className="cat-edit" onClick={(e) => { e.stopPropagation(); editCategory(k) }}><PencilSimple size={18} /></button>
                </div>
              ))}
              {cats.length === 0 && <div className="empty"><div className="big">🏷️</div>Belum ada kategori.</div>}
            </div>
          </div>

          {/* ===== Form Tambah / Edit Kategori (full screen, selalu tampil nav) ===== */}
          {showCatForm && (
            <div className="edit-screen">
              <div className="edit-top">
                <button className="edit-back" aria-label="Kembali" onClick={() => { setShowCatForm(false); setC({ name: '', emoji: '📦', image: '', active: true }) }}><ArrowLeft size={20} /></button>
                <div className="edit-title"><h1>{c.id ? 'Edit Kategori' : 'Tambah Kategori'}</h1><div className="edit-sub">Isi nama dan foto kategori</div></div>
              </div>
              <div className="edit-body">
                <ImageUpload value={c.image} onChange={(v) => setC({ ...c, image: v })} folder="categories" label="Foto Kategori" recommend="Foto akan ditampilkan di halaman kategori" height={130} />
                <div className="edit-block">
                  <div className="field"><label>Nama Kategori</label><input value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} placeholder="Contoh: Fashion" /></div>
                  <label className="switch-row">
                    <span>Status</span>
                    <button type="button" className={'toggle' + (c.active ? ' on' : '')} onClick={() => setC({ ...c, active: !c.active })}><span className="knob" /></button>
                  </label>
                </div>
                <div className="edit-foot">
                  <button className="btn ghost block" type="button" onClick={() => { setShowCatForm(false); setC({ name: '', emoji: '📦', image: '', active: true }) }}>Batal</button>
                  <button className="btn block orange" type="button" onClick={saveCat}><FloppyDisk size={16} /> Simpan</button>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {tab === 'menu' && (
        <>
          <div className="ad-pad" />

          <div className="konten-section">
            <div className="konten-card">
              <div className="khead">
                <div className="kh-ico" style={{ background: 'linear-gradient(135deg,#1B2A4A,#FF7A1A)', color: '#fff' }}><Storefront size={20} /></div>
                <div><div className="kh-t">Tampilan Toko</div><div className="kh-s">Logo, nama, dan warna brand</div></div>
              </div>
              <div className="kbody">
                <div className="krow">
                  <div className="krow-l">Logo Toko</div>
                  <div className="krow-r"><ImageUpload value={s.logoImage} onChange={(v) => setS({ ...s, logoImage: v })} folder="logos" label="Upload" recommend="" height={64} /></div>
                </div>
                <div className="krow">
                  <div className="krow-l">Nama brand</div>
                  <div className="krow-r"><input value={s.brandName} onChange={(e) => setS({ ...s, brandName: e.target.value })} placeholder="mils time" /></div>
                </div>
                <div className="krow">
                  <div className="krow-l">Warna navy</div>
                  <div className="krow-r"><input type="color" value={s.navy} onChange={(e) => setS({ ...s, navy: e.target.value })} style={{ height: 40, width: 60, padding: 2, border: '1px solid var(--line)', borderRadius: 10 }} /></div>
                </div>
                <div className="krow">
                  <div className="krow-l">Warna orange</div>
                  <div className="krow-r"><input type="color" value={s.orange} onChange={(e) => setS({ ...s, orange: e.target.value })} style={{ height: 40, width: 60, padding: 2, border: '1px solid var(--line)', borderRadius: 10 }} /></div>
                </div>
                <button className="btn block orange" type="button" onClick={saveAppearance} style={{ marginTop: 6 }}><FloppyDisk size={16} /> Simpan tampilan</button>
              </div>
            </div>
          </div>

          <div className="konten-section">
            <div className="konten-card">
              <div className="khead">
                <div className="kh-ico" style={{ background: '#FFF1E6', color: 'var(--orange)' }}><Images size={20} /></div>
                <div><div className="kh-t">Banner</div><div className="kh-s">Promo di beranda toko</div></div>
              </div>
              <form onSubmit={saveBan} className="kadd">
                <ImageUpload value={b.image} onChange={(v) => setB({ ...b, image: v })} folder="banners" label="Foto" recommend="" height={56} />
                <input placeholder="Judul" value={b.title} onChange={(e) => setB({ ...b, title: e.target.value })} />
                <input placeholder="Subtitle" value={b.subtitle} onChange={(e) => setB({ ...b, subtitle: e.target.value })} />
                <button className="btn sm orange" type="submit"><Plus size={16} /> Tambah</button>
              </form>
              <div className="konten-list">
                {banners.map((bn) => (
                  <div className="konten-item" key={bn.id}>
                    {bn.image ? <img className="pic" src={bn.image} alt={bn.title} /> : <div className="pic" style={{ background: bn.color }}>{bn.emoji}</div>}
                    <div className="info"><div className="nm">{bn.title}</div><div className="meta">{bn.subtitle}</div></div>
                    <div className="acts"><button className="btn ghost sm" onClick={() => { if (db) deleteBanner(bn.id) }}><Trash size={15} /></button></div>
                  </div>
                ))}
                {banners.length === 0 && <div className="empty"><div className="big">🖼️</div>Belum ada banner.</div>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ============ AKUN ============ */}
      {tab === 'menu' && (
        <>
          <div className="ad-pad" />
          <div className="akun-head">
            {s.logoImage ? <img className="akun-ava" src={s.logoImage} alt="logo" /> : <div className="akun-ava">{s.logoEmoji}</div>}
            <div><div className="nm">{s.brandName}</div><div className="rl">Admin • {email || 'admin@milstime.com'}</div></div>
          </div>
          <div className="akun-menu">
            <div className="mi"><Storefront size={20} /> Informasi Toko <span className="rt">{s.brandName}</span></div>
            <div className="mi" onClick={() => setTab('konten')} style={{ cursor: 'pointer' }}><Images size={20} /> Kelola Konten <span className="rt">›</span></div>
            <div className="mi"><Package size={20} /> Total Produk <span className="rt">{products.length}</span></div>
            <div className="mi"><ShoppingBag size={20} /> Total Pesanan <span className="rt">{orders.length}</span></div>
          </div>

          <div className="card" style={{ marginTop: 14 }}>
            <div className="section-title" style={{ marginTop: 0 }}>Pembayaran QRIS</div>
            <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>Upload QRIS merchant. Pelanggan scan saat checkout QRIS (verifikasi manual).</div>
            <ImageUpload value={s.qrisUrl} onChange={(v) => setS({ ...s, qrisUrl: v })} folder="qris" label="Upload QRIS" recommend="Gambar QRIS merchant" height={160} />
            <button className="btn block orange" type="button" onClick={saveAppearance} style={{ marginTop: 10 }}><FloppyDisk size={16} /> Simpan pembayaran</button>
          </div>

          <div className="akun-logout"><button className="btn block" onClick={logout}><SignOut size={16} /> Keluar</button></div>
        </>
      )}

      {flashFor && (
        <div className="flash-modal">
          <div className="flash-card">
            <div className="flash-head">
              <button className="edit-back" aria-label="Tutup" onClick={() => setFlashFor(null)}><X size={20} /></button>
              <div className="edit-title"><h1>Flash Sale</h1><div className="edit-sub">{flashFor.name}</div></div>
            </div>
            <div className="flash-body">
              <label className="switch-row">
                <span>Aktifkan Flash Sale</span>
                <button type="button" className={'toggle' + (flashFor.flash ? ' on' : '')} onClick={() => setFlashFor({ ...flashFor, flash: !flashFor.flash })}><span className="knob" /></button>
              </label>
              <div className="field"><label>Diskon (%)</label><input type="number" value={flashFor.flashDisc || 0} onChange={(e) => setFlashFor({ ...flashFor, flashDisc: +e.target.value })} placeholder="Contoh: 20" /></div>
              <button className="btn orange block" type="button" onClick={saveFlash}>Simpan</button>
            </div>
          </div>
        </div>
      )}

      {!showForm && !flashFor && (
      <nav className="bottomnav owner-nav">
        {TABS.map((t) => {
          const Ico = t.icon
          const badge = t.id === 'produk' && countFlash > 0 ? countFlash : null
          return (
            <button key={t.id} className={'admin-tab' + (tab === t.id ? ' on' : '')} onClick={() => setTab(t.id)}>
              <span className="nav-ico">{Ico && <Ico size={22} />}{badge && <span className="nav-badge">{badge}</span>}</span>
              <span>{t.label}</span>
            </button>
          )
        })}
      </nav>
      )}

      {notice && (
        <div className={'toast ' + notice.type}>
          <span className="toast-ico">{notice.type === 'err' ? '⚠️' : '✅'}</span>
          <span className="toast-msg">{notice.msg}</span>
        </div>
      )}
    </div>
  )
}
