import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/Cart.jsx'
import { useProducts } from '../data/products.js'
import { db, doc, setDoc } from '../firebase.js'

export default function Cart() {
  const { cart, sub, add, remove, clear } = useCart()
  const { products } = useProducts()
  const [form, setForm] = useState({ name: '', phone: '', address: '' })
  const [done, setDone] = useState(null)
  const navigate = useNavigate()

  const items = Object.entries(cart)
    .map(([id, qty]) => { const p = products.find((x) => x.id === id); return p ? { ...p, qty } : null })
    .filter(Boolean)
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)

  async function checkout() {
    if (!items.length || !form.name) return
    const token = Math.random().toString(36).slice(2, 8).toUpperCase()
    const order = {
      token, customerName: form.name, phone: form.phone, address: form.address,
      status: 'menunggu', createdAt: Date.now(),
      items: items.map((i) => ({ productId: i.id, name: i.name, qty: i.qty, price: i.price })),
      totalPrice: total, courierId: null,
    }
    const stored = JSON.parse(localStorage.getItem('milstime_orders') || '[]')
    stored.push(order)
    localStorage.setItem('milstime_orders', JSON.stringify(stored))
    if (db) { try { await setDoc(doc(db, 'orders', token), order) } catch (e) {} }
    clear()
    setDone(order)
  }

  if (done) return (
    <div className="card" style={{ textAlign: 'center' }}>
      <div className="empty"><div className="big">🎉</div></div>
      <h2 style={{ marginTop: 0, color: 'var(--navy)' }}>Pesanan diterima!</h2>
      <p className="muted">Simpan kode lacak kamu</p>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '0.1em', color: 'var(--orange)' }}>{done.token}</div>
      <a className="btn ghost block" style={{ marginTop: 12 }} href={`/track/${done.token}`}>Lacak kurir</a>
      <button className="btn block" style={{ marginTop: 8 }} onClick={() => navigate('/orders')}>Lihat pesanan</button>
    </div>
  )

  if (!items.length) return (
    <div className="empty"><div className="big">🛒</div><p>Keranjang kosong.<br />Pilih produk di Beranda.</p><a className="btn" href="/">Belanja sekarang</a></div>
  )

  return (
    <>
      <div className="section-title">Keranjang ({items.reduce((a, i) => a + i.qty, 0)})</div>
      {items.map((i) => (
        <div className="order" key={i.id}>
          <div className="head"><b>{i.emoji} {i.name}</b><span style={{ color: 'var(--orange)', fontWeight: 800 }}>Rp {(i.price * i.qty).toLocaleString('id-ID')}</span></div>
          <div className="row" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="qty"><button className="btn ghost sm" onClick={() => sub(i.id)}>−</button><b>{i.qty}</b><button className="btn sm" onClick={() => add(i.id)}>+</button></div>
            <button className="btn ghost sm" onClick={() => remove(i.id)}>Hapus</button>
          </div>
        </div>
      ))}

      <div className="card" style={{ marginTop: 12 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 18, color: 'var(--navy)' }}>
          <span>Total</span><span>Rp {total.toLocaleString('id-ID')}</span>
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Data pengiriman</div>
        <div className="field"><label>Nama</label><input placeholder="Nama lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label>No. HP</label><input placeholder="08xx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="field"><label>Alamat</label><textarea rows={2} placeholder="Alamat lengkap" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <button className="btn block" onClick={checkout}>Pesan sekarang</button>
      </div>
    </>
  )
}
