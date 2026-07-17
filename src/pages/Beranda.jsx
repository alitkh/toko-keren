import { useProducts } from '../data/products.js'
import { useCart } from '../context/Cart.jsx'
import { useCategories } from '../data/categories.js'
import { useBanners } from '../data/banners.js'
import { useSettings } from '../data/settings.js'
import { useSearchParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { MagnifyingGlass, Lightning, Plus, Minus } from '@phosphor-icons/react'
import BannerSlider from '../components/BannerSlider.jsx'
import ProductModal from '../components/ProductModal.jsx'
import { CATEGORIES, SORTS } from '../data/dummy.js'

function getOrderHistory() {
  try { return JSON.parse(localStorage.getItem('milstime_orders') || '[]') } catch { return [] }
}
function getCountdown() {
  const end = new Date(); end.setHours(23, 59, 59, 999)
  let diff = Math.max(0, Math.floor((end - new Date()) / 1000))
  const h = String(Math.floor(diff / 3600)).padStart(2, '0')
  const m = String(Math.floor((diff % 3600) / 60)).padStart(2, '0')
  const s = String(diff % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function Beranda() {
  const { products, loading } = useProducts()
  const { cats } = useCategories()
  const { banners } = useBanners()
  const { settings } = useSettings()
  const { cart, add, sub } = useCart()
  const [params, setParams] = useSearchParams()
  const q = (params.get('q') || '').trim().toLowerCase()
  const cat = params.get('cat') || 'all'
  const sort = params.get('sort') || 'default'
  const [clock, setClock] = useState(getCountdown())
  const [openId, setOpenId] = useState(null)

  const categoryList = cats.length ? cats.map((c) => ({ id: c.id, name: c.name || c.label, emoji: c.emoji || c.label })) : CATEGORIES.map((c) => ({ ...c, name: c.label || c.name }))
  const bannerList = banners.length ? banners : null
  const flashOn = settings?.flashOn && settings?.flashEnd && new Date(settings.flashEnd) > new Date()

  useEffect(() => { const t = setInterval(() => setClock(getCountdown()), 1000); return () => clearInterval(t) }, [])

  let list = products.filter((p) => {
    if (p.active === false) return false
    const matchCat = cat === 'all' || p.cat === cat
    const matchQ = !q || (p.name || '').toLowerCase().includes(q) || (p.desc || '').toLowerCase().includes(q)
    return matchCat && matchQ
  })
  if (sort === 'low') list = [...list].sort((a, b) => (a.flashPrice || a.price) - (b.flashPrice || b.price))
  else if (sort === 'high') list = [...list].sort((a, b) => (b.flashPrice || b.price) - (a.flashPrice || a.price))
  else if (sort === 'stock') list = [...list].sort((a, b) => (b.stock || 0) - (a.stock || 0))

  const flashItems = products.filter((p) => p.flash && p.active !== false)
  const history = getOrderHistory()
  const boughtIds = []
  history.forEach((o) => (o.items || []).forEach((it) => { if (!boughtIds.includes(it.productId)) boughtIds.push(it.productId) }))
  const bought = boughtIds.map((id) => products.find((p) => p && p.id === id)).filter(Boolean)
  const openProduct = products.find((p) => p.id === openId) || null

  function onSearch(e) {
    const v = e.target.value
    const next = new URLSearchParams(params)
    if (v) next.set('q', v); else next.delete('q')
    setParams(next, { replace: true })
  }
  function setParam(key, val, def) {
    const next = new URLSearchParams(params)
    if (val === def) next.delete(key); else next.set(key, val)
    setParams(next, { replace: true })
  }

  return (
    <>
      <span id="top" />
      <BannerSlider banners={bannerList} flashOn={flashOn} flashEnd={settings?.flashEnd} />

      <div className="searchbar">
        <MagnifyingGlass size={18} className="searchbar-ico" />
        <input className="searchbar-input" type="search" placeholder="Cari produk" value={params.get('q') || ''} onChange={onSearch} aria-label="Cari produk" />
      </div>

      <div className="cat-head">
        <h2 className="cat-title">Kategori</h2>
        <button className="cat-seeall" onClick={() => { setSearchParams(new URLSearchParams()); document.getElementById('top')?.scrollIntoView({ behavior: 'smooth' }); }}>Lihat Semua</button>
      </div>
      <div className="cat-row">
        {categoryList.map((c) => (
          <button key={c.id} className={'cat-item' + (cat === c.id ? ' on' : '')} onClick={() => setParam('cat', c.id, 'all')}>
            <span className="cat-circle">{c.emoji}</span>
            <span className="cat-label">{c.name}</span>
          </button>
        ))}
      </div>

      {/* Flash Sale */}
      {flashItems.length > 0 && (
        <div className="flash">
          <div className="flash-head">
            <div className="flash-title"><Lightning size={18} weight="fill" /> Flash Sale</div>
            <div className="flash-clock">{clock}</div>
          </div>
          <div className="hscroll">
            {flashItems.map((p) => {
              const price = p.flashPrice || p.price
              const n = cart[p.id] || 0
              return (
                <div className="flash-card" key={p.id}>
                  <div className="flash-thumb" onClick={() => setOpenId(p.id)}>{p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} /> : null}<span style={{ display: p.image ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>{p.emoji || '📦'}</span></div>
                  <div className="flash-info">
                  <div className="flash-name" onClick={() => setOpenId(p.id)}>{p.name}</div>
                  <div className="flash-price">Rp {price?.toLocaleString('id-ID')}</div>
                  <div className="flash-old">Rp {p.price?.toLocaleString('id-ID')}</div>
                  <div className="flash-act">
                    {n > 0
                      ? <div className="qty"><button className="btn ghost sm" onClick={() => sub(p.id)}><Minus size={14} /></button><b>{n}</b><button className="btn sm" onClick={() => add(p.id)}><Plus size={14} /></button></div>
                      : <button className="btn block sm" onClick={() => add(p.id)}><Plus size={14} /> Keranjang</button>}
                  </div>
              </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {bought.length > 0 && (
        <>
          <div className="section-title">Beli lagi</div>
          <div className="hscroll">
            {bought.map((p) => (
              <div className="again" key={p.id} onClick={() => add(p.id)}>
                <div className="again-thumb">{p.emoji || '📦'}</div>
                <div className="again-name">{p.name}</div>
                <div className="again-price">Rp {p.price?.toLocaleString('id-ID')}</div>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-title row-title">
        <span>{cat === 'all' ? 'Produk pilihan' : CATEGORIES.find((c) => c.id === cat)?.label}{q && ` · "${q}"`}</span>
        <select className="sort" value={sort} onChange={(e) => setParam('sort', e.target.value, 'default')} aria-label="Urutkan">
          {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="empty"><div className="big">⏳</div>Memuat produk…</div>
      ) : list.length === 0 ? (
        <div className="empty"><div className="big">🔍</div><p>{q ? `Tidak ada hasil untuk "${q}".` : 'Belum ada produk.'}<br />Tambah lewat <a href="/admin">admin</a>.</p></div>
      ) : (
        <div className="grid">
          {list.map((p) => {
            const price = p.flashPrice && p.flash ? p.flashPrice : p.price
            const n = cart[p.id] || 0
            return (
              <div className="product" key={p.id} onClick={() => setOpenId(p.id)}>
                {p.flash && <span className="flash-tag">Flash</span>}
                <div className="thumb">{p.image ? <img src={p.image} alt={p.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex' }} /> : null}<span style={{ display: p.image ? 'none' : 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>{p.emoji || '📦'}</span></div>
                <div className="body">
                  <div className="name">{p.name}</div>
                  <div className="price">Rp {price?.toLocaleString('id-ID')}</div>
                  {p.flash && <div className="price-old">Rp {p.price?.toLocaleString('id-ID')}</div>}
                  <div className="stock">stok {p.stock}</div>
                  <div style={{ marginTop: 'auto' }} onClick={(e) => e.stopPropagation()}>
                    {n > 0
                      ? <div className="qty"><button className="btn ghost sm" onClick={() => sub(p.id)}><Minus size={14} /></button><b>{n}</b><button className="btn sm" onClick={() => add(p.id)}><Plus size={14} /></button></div>
                      : <button className="btn block sm" onClick={() => add(p.id)}><Plus size={14} /> Tambahkan keranjang</button>}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <ProductModal
        product={openProduct}
        cartQty={openProduct ? (cart[openProduct.id] || 0) : 0}
        onAdd={() => add(openProduct.id)}
        onSub={() => sub(openProduct.id)}
        onClose={() => setOpenId(null)}
      />
    </>
  )
}
