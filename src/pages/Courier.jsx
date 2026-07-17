import { useEffect, useRef, useState } from 'react'
import { auth, signInWithEmailAndPassword, signOut, db, collection, query, where, onSnapshot, doc, updateDoc, ref, set } from '../firebase.js'
import { demo } from '../data/demoStore.js'

const BASE = { lat: -6.2, lng: 106.8 }

export default function Courier() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [orders, setOrders] = useState([])
  const [active, setActive] = useState(null)
  const [pos, setPos] = useState(null)
  const watchRef = useRef(null)
  const simRef = useRef(null)

  useEffect(() => {
    demo.init()
    if (db) return auth.onAuthStateChanged((u) => setUser(u))
    setUser(demo.currentUser())
  }, [])
  useEffect(() => {
    if (db && user) {
      const q = query(collection(db, 'orders'), where('status', 'in', ['dikemas', 'dikirim']))
      return onSnapshot(q, (s) => setOrders(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
    }
    if (!db) {
      const refresh = () => setOrders(demo.getOrders().filter((o) => ['dikemas', 'dikirim'].includes(o.status)))
      refresh()
      window.addEventListener('storage', refresh)
      return () => window.removeEventListener('storage', refresh)
    }
  }, [user])

  async function login(e) {
    e.preventDefault()
    if (db) await signInWithEmailAndPassword(auth, email, pass)
    else setUser(demo.login(email || 'kurir@demo'))
  }
  function logout() { if (db) signOut(auth); else { demo.logout(); setUser(null) } }

  function startDelivery(orderId) {
    setActive(orderId)
    const token = demo.getOrders().find((o) => o.id === orderId)?.token || orderId
    if (db) updateDoc(doc(db, 'orders', orderId), { status: 'dikirim' })
    else { demo.updateOrder(token, { status: 'dikirim' }); setOrders(demo.getOrders().filter((o) => ['dikemas', 'dikirim'].includes(o.status))) }

    if (navigator.geolocation) {
      watchRef.current = navigator.geolocation.watchPosition(
        (g) => {
          const lat = g.coords.latitude, lng = g.coords.longitude
          setPos({ lat, lng })
          if (db) set(ref('tracking/' + orderId + '/position'), { lat, lng, ts: Date.now() })
          else demo.setTrack(token, { lat, lng, ts: Date.now() })
        },
        () => simulate(orderId, token),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      )
    } else { simulate(orderId, token) }
  }

  // Fallback: gerakkan posisi perlahan ke arah acak (demo tanpa GPS)
  function simulate(orderId, token) {
    let cur = { ...BASE }
    simRef.current = setInterval(() => {
      cur = { lat: cur.lat + (Math.random() - 0.5) * 0.002, lng: cur.lng + (Math.random() - 0.5) * 0.002 }
      setPos(cur)
      if (db) set(ref('tracking/' + orderId + '/position'), { ...cur, ts: Date.now() })
      else demo.setTrack(token, { ...cur, ts: Date.now() })
    }, 1500)
  }

  function stopDelivery(orderId) {
    if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    if (simRef.current) clearInterval(simRef.current)
    watchRef.current = null; simRef.current = null; setActive(null); setPos(null)
    const token = demo.getOrders().find((o) => o.id === orderId)?.token || orderId
    if (db) { updateDoc(doc(db, 'orders', orderId), { status: 'sampai' }); set(ref('tracking/' + orderId + '/position'), { lat: null, lng: null, ts: Date.now() }) }
    else { demo.updateOrder(token, { status: 'sampai' }); demo.setTrack(token, null); setOrders(demo.getOrders().filter((o) => ['dikemas', 'dikirim'].includes(o.status))) }
  }

  if (!user) return (
    <div className="wrap">
      <div className="card">
        <h2 style={{ marginTop: 0, color: 'var(--navy)' }}>Masuk Kurir</h2>
        <form onSubmit={login}>
          <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kurir@demo" /></div>
          <div className="field"><label>Password</label><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="bebas (mode demo)" /></div>
          <button className="btn block" type="submit">Masuk</button>
        </form>
        {!db && <p style={{ fontSize: 12, color: 'var(--muted)', marginTop: 10 }}>Mode demo aktif — login tanpa Firebase. GPS disimulasikan.</p>}
      </div>
    </div>
  )

  return (
    <div className="wrap">
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
        <button className="btn ghost sm" onClick={logout}>Keluar</button>
      </div>
        {active && (
          <div className="card" style={{ marginBottom: 12, border: '1px solid var(--orange)' }}>
            <b>Mengantar #{active}</b>
            {pos && <div style={{ fontSize: 13, color: 'var(--muted)' }}>GPS: {pos.lat.toFixed(5)}, {pos.lng.toFixed(5)}</div>}
            <button className="btn block" style={{ marginTop: 8 }} onClick={() => stopDelivery(active)}>Tandai Sampai</button>
          </div>
        )}
        <div className="section-title">Order menunggu kirim ({orders.length})</div>
        {orders.length === 0 && <div className="empty"><div className="big">✅</div>Tidak ada order aktif.</div>}
        {orders.map((o) => (
          <div className="order" key={o.id || o.token}>
            <div className="head"><b>#{o.token} · {o.customerName}</b><span className={`tag ${o.status}`}>{o.status}</span></div>
            <div className="items">{o.items?.map((i) => `${i.name} x${i.qty}`).join(', ')}</div>
            <div className="items">{o.address}</div>
            {o.status === 'dikirim' && o.id === active
              ? <div style={{ color: 'var(--orange)', fontWeight: 700, marginTop: 8 }}>● Live mengantar</div>
              : <button className="btn block" style={{ marginTop: 10 }} onClick={() => startDelivery(o.id)}>Mulai antar</button>}
          </div>
        ))}
      </div>
  )
}
