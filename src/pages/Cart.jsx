import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../context/Cart.jsx'
import { useProducts } from '../data/products.js'
import { db, doc, setDoc } from '../firebase.js'
import { useCustomer } from '../data/auth.js'
import { useSettings } from '../data/settings.js'
import AddressPicker from '../components/AddressPicker.jsx'

export default function Cart() {
  const { cart, sub, add, remove, clear } = useCart()
  const { user } = useCustomer()
  const { settings } = useSettings()
  const { products } = useProducts()
  const [form, setForm] = useState({ name: '', phone: '', address: '', method: 'cod', date: '', time: '', lat: null, lng: null, label: 'Rumah' })
  const [done, setDone] = useState(null)
  const [voucher, setVoucher] = useState('')
  const [voucherMsg, setVoucherMsg] = useState('')
  const [discount, setDiscount] = useState(0)
  const SHIP_FLAT = 5000
  const FREE_SHIP_MIN = 50000
  const shipCost = total >= FREE_SHIP_MIN ? 0 : SHIP_FLAT
  const grandTotal = Math.max(0, total - discount) + shipCost
  function pickAddr(v) { setForm({ ...form, lat: v.lat, lng: v.lng, address: v.address || form.address }) }
  const navigate = useNavigate()

  const items = Object.entries(cart)
    .map(([id, qty]) => { const p = products.find((x) => x.id === id); return p ? { ...p, qty } : null })
    .filter(Boolean)
  const total = items.reduce((s, i) => s + i.price * i.qty, 0)

  function applyVoucher() {
    const code = voucher.trim().toUpperCase()
    const list = settings?.vouchers || []
    const found = list.find((v) => v.code === code)
    if (found) {
      const d = Math.round(total * (found.percent || 0) / 100)
      setDiscount(d); setVoucherMsg('Voucher ' + found.percent + '% diterapkan')
    } else if (code === 'MILS10') { setDiscount(Math.round(total * 0.1)); setVoucherMsg('Voucher 10% diterapkan') }
    else if (code === 'GRATISONGKIR') { setDiscount(0); setVoucherMsg('Voucher gratis ongkir (pakai di ongkir)') }
    else if (code) { setVoucherMsg('Kode tidak valid') }
  }

  async function checkout() {
    if (!items.length || !form.name) return
    const token = Math.random().toString(36).slice(2, 8).toUpperCase()
    const order = {
      token, customerName: form.name, phone: form.phone, address: form.address, userId: user?.uid || null,
      method: form.method, schedule: (form.date && form.time) ? `${form.date} ${form.time}` : '',
      lat: form.lat, lng: form.lng, addressLabel: form.label,
      status: 'menunggu', createdAt: Date.now(),
      items: items.map((i) => ({ productId: i.id, name: i.name, qty: i.qty, price: i.price })),
      totalPrice: grandTotal, discount, shipCost, courierId: null,
    }
    const stored = JSON.parse(localStorage.getItem('milstime_orders') || '[]')
    stored.push(order)
    localStorage.setItem('milstime_orders', JSON.stringify(stored))
    if (db) { try { await setDoc(doc(db, 'orders', token), order) } catch (e) {} }
    try { await fetch('/api/notify-order', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(order) }) } catch (e) {}
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
        <div className="row-bw"><span>Subtotal</span><span>Rp {total.toLocaleString('id-ID')}</span></div>
        <div className="row-bw"><span>Ongkir</span><span>{shipCost === 0 ? 'Gratis' : 'Rp ' + shipCost.toLocaleString('id-ID')}</span></div>
        {discount > 0 && <div className="row-bw" style={{ color: 'var(--orange)' }}><span>Diskon voucher</span><span>-Rp {discount.toLocaleString('id-ID')}</span></div>}
        <div className="row-bw" style={{ fontWeight: 800, fontSize: 18, color: 'var(--navy)', marginTop: 4 }}><span>Total</span><span>Rp {grandTotal.toLocaleString('id-ID')}</span></div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Voucher</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input placeholder="Kode voucher" value={voucher} onChange={(e) => setVoucher(e.target.value)} style={{ flex: 1 }} />
          <button className="btn sm" onClick={applyVoucher}>Pakai</button>
        </div>
        {voucherMsg && <div className="muted" style={{ fontSize: 12, marginTop: 6 }}>{voucherMsg}</div>}
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <div className="section-title" style={{ marginTop: 0 }}>Data pengiriman</div>
        <div className="field"><label>Nama</label><input placeholder="Nama lengkap" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
        <div className="field"><label>No. HP</label><input placeholder="08xx" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
        <div className="field"><label>Label alamat</label>
          <select value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })}>
            <option>Rumah</option><option>Kantor</option><option>Lainnya</option>
          </select>
        </div>
        <div className="field"><label>Alamat</label><textarea rows={2} placeholder="Alamat lengkap + patokan" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
        <div className="muted" style={{ fontSize: 12 }}>Tap peta untuk titik alamat:</div>
        <AddressPicker lat={form.lat} lng={form.lng} onPick={pickAddr} />
        <div className="field"><label>Jadwal kirim — Tanggal</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></div>
        <div className="field"><label>Jam</label><input type="time" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} /></div>
        <div className="section-title" style={{ marginTop: 8 }}>Metode pembayaran</div>
        <div className="seg">
          <button className={form.method === 'cod' ? 'seg-on' : ''} onClick={() => setForm({ ...form, method: 'cod' })}>COD</button>
          <button className={form.method === 'qris' ? 'seg-on' : ''} onClick={() => setForm({ ...form, method: 'qris' })}>QRIS</button>
        </div>
        {form.method === 'qris' && (
          <div className="qris-box">
            {settings?.qrisUrl ? (
              <>
                <img src={settings.qrisUrl} alt="QRIS" style={{ width: 160, height: 160, objectFit: 'contain', borderRadius: 8, background: '#fff', display: 'block', margin: '0 auto 8px' }} />
                <div className="muted center" style={{ fontSize: 13 }}>Scan QRIS di atas untuk membayar <b>Rp {total.toLocaleString('id-ID')}</b>. Admin verifikasi manual.</div>
              </>
            ) : (
              <div className="muted" style={{ fontSize: 13 }}>QRIS merchant belum diatur admin. Pilih COD atau hubungi toko.</div>
            )}
          </div>
        )}
        <button className="btn block" onClick={checkout}>Pesan sekarang</button>
      </div>
    </>
  )
}
