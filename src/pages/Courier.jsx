import { useEffect, useRef, useState } from 'react'
import { auth, signInWithEmailAndPassword, signOut, db, collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, ref, set } from '../firebase.js'
import { demo } from '../data/demoStore.js'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const BASE = { lat: -6.2, lng: 106.8 }

function haversine(a, b) {
  const R = 6371
  const dLat = (b.lat - a.lat) * Math.PI / 180
  const dLng = (b.lng - a.lng) * Math.PI / 180
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * Math.PI / 180) * Math.cos(b.lat * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

function optimizeRoute(start, stops) {
  const out = []
  const rem = [...stops]
  let cur = start
  while (rem.length) {
    let bi = 0, bd = Infinity
    rem.forEach((s, i) => { const d = haversine(cur, s); if (d < bd) { bd = d; bi = i } })
    out.push(rem[bi]); cur = rem[bi]; rem.splice(bi, 1)
  }
  return out
}

export default function Courier() {
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [pass, setPass] = useState('')
  const [orders, setOrders] = useState([])
  const [trip, setTrip] = useState(null)
  const [route, setRoute] = useState([])
  const [pos, setPos] = useState(null)
  const [proof, setProof] = useState(null)
  const [codReceived, setCodReceived] = useState({})
  const watchRef = useRef(null)
  const mapRef = useRef(null)
  const elRef = useRef(null)

  useEffect(() => {
    demo.init()
    if (db) return auth.onAuthStateChanged((u) => setUser(u))
    setUser(demo.currentUser())
  }, [])

  useEffect(() => {
    if (!user) return
    if (db) {
      const q = query(collection(db, 'orders'), where('status', 'in', ['dikemas', 'ditugaskan', 'dikirim']))
      return onSnapshot(q, (s) => setOrders(s.docs.map((d) => ({ id: d.id, ...d.data() }))))
    }
    const refresh = () => setOrders(demo.getOrders().filter((o) => ['dikemas', 'ditugaskan', 'dikirim'].includes(o.status)))
    refresh()
    window.addEventListener('storage', refresh)
    return () => window.removeEventListener('storage', refresh)
  }, [user])

  async function login(e) {
    e.preventDefault()
    if (db) await signInWithEmailAndPassword(auth, email, pass)
    else setUser(demo.login(email || 'kurir@demo'))
  }
  function logout() { if (db) signOut(auth); else { demo.logout(); setUser(null) } }

  const available = orders.filter((o) => o.status === 'dikemas' && !o.courierId)
  const myTrip = orders.filter((o) => o.status === 'ditugaskan' || o.status === 'dikirim')

  async function takeTask(orderId) {
    if (db) await updateDoc(doc(db, 'orders', orderId), { courierId: user.uid, status: 'ditugaskan' })
    else { const t = demo.getOrders().find((o) => o.id === orderId)?.token; demo.updateOrder(t, { courierId: 'kurir', status: 'ditugaskan' }) }
    startTrip([orderId])
  }

  function startTrip(ids) {
    const stops = ids.map((id) => {
      const o = orders.find((x) => x.id === id)
      return { id, lat: o.lat || BASE.lat, lng: o.lng || BASE.lng }
    }).filter((s) => s.lat)
    const r = stops.length ? optimizeRoute(BASE, stops) : []
    setTrip({ id: 'trip_' + Date.now(), orderIds: ids })
    setRoute(r)
  }

  function startDelivery() {
    trip.orderIds.forEach((id) => {
      if (db) updateDoc(doc(db, 'orders', id), { status: 'dikirim' })
      else { const t = demo.getOrders().find((o) => o.id === id)?.token; demo.updateOrder(t, { status: 'dikirim' }) }
    })
    if (navigator.geolocation) {
      watchRef.current = navigator.geolocation.watchPosition(
        (g) => {
          const lat = g.coords.latitude, lng = g.coords.longitude
          setPos({ lat, lng })
          trip.orderIds.forEach((id) => {
            if (db) set(ref('tracking/' + id + '/position'), { lat, lng, ts: Date.now() })
            else { const t = demo.getOrders().find((o) => o.id === id)?.token; demo.setTrack(t, { lat, lng, ts: Date.now() }) }
          })
        }, () => {}, { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
      )
    }
  }

  async function finishOrder(orderId) {
    if (db) await updateDoc(doc(db, 'orders', orderId), { status: 'sampai', proof, codReceived: !!codReceived[orderId] })
    else { const t = demo.getOrders().find((o) => o.id === orderId)?.token; demo.updateOrder(t, { status: 'sampai', proof, codReceived: !!codReceived[orderId] }) }
    setTrip((tr) => ({ ...tr, orderIds: tr.orderIds.filter((x) => x !== orderId) }))
    if (trip.orderIds.length <= 1) {
      setTrip(null); setPos(null)
      if (watchRef.current) navigator.geolocation.clearWatch(watchRef.current)
    }
  }

  useEffect(() => {
    if (!elRef.current || mapRef.current || !route.length) return
    mapRef.current = L.map(elRef.current, { zoomControl: false }).setView([BASE.lat, BASE.lng], 13)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapRef.current)
    route.forEach((s, i) => L.marker([s.lat, s.lng]).addTo(mapRef.current).bindPopup('Stop ' + (i + 1)))
    if (pos) L.marker([pos.lat, pos.lng]).addTo(mapRef.current).bindPopup('Kurir')
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [route, pos])

  if (!user) {
    return (
      <div className="app">
        <div className="wrap" style={{ maxWidth: 380, margin: '0 auto', paddingTop: 40 }}>
          <div className="brand" style={{ justifyContent: 'center', marginBottom: 20 }}>
            <span className="brand-mark"><span className="brand-mils">mils</span><span className="brand-time">time</span><span className="brand-line" /></span>
          </div>
          <div className="card">
            <h2 style={{ marginTop: 0 }}>Login Kurir</h2>
            <form onSubmit={login}>
              <div className="field"><label>Email</label><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="kurir@milstime.com" /></div>
              <div className="field"><label>Password</label><input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="password" /></div>
              <button className="btn block" type="submit">Masuk</button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark"><span className="brand-mils">mils</span><span className="brand-time">time</span><span className="brand-line" /></span>
        </div>
        <span className="owner-tag" onClick={logout} style={{ cursor: 'pointer' }}>Kurir • Keluar</span>
      </div>
      <div className="wrap">
        {!trip && (
          <div>
            <div className="section-title">Tugas Tersedia ({available.length})</div>
            {available.map((o) => (
              <div className="order" key={o.id}>
                <div className="head"><b>#{o.token}</b><span className="tag dikemas">Dikemas</span></div>
                <div className="items">{o.items?.map((i) => `${i.name} x${i.qty}`).join(', ')}</div>
                <div className="items">Alamat: {o.addressLabel} — {o.address}</div>
                <div className="row"><button className="btn block sm" onClick={() => takeTask(o.id)}>Ambil Tugas</button></div>
              </div>
            ))}
            {available.length === 0 && <div className="empty"><div className="big">✅</div>Tidak ada tugas tersedia.</div>}
            {myTrip.length > 0 && (
              <div>
                <div className="section-title" style={{ marginTop: 16 }}>Trip Saya ({myTrip.length})</div>
                {myTrip.map((o) => (
                  <div className="order" key={o.id}>
                    <div className="head"><b>#{o.token}</b><span className={`tag ${o.status}`}>{o.status}</span></div>
                    <div className="items">{o.addressLabel} — {o.address}</div>
                  </div>
                ))}
                <button className="btn block orange" onClick={() => startTrip(myTrip.map((o) => o.id))}>Mulai Pengiriman Batch</button>
              </div>
            )}
          </div>
        )}
        {trip && (
          <div>
            <div className="section-title">Trip Aktif ({trip.orderIds.length} order)</div>
            <div ref={elRef} id="courier-map" style={{ height: 220, borderRadius: 12, marginBottom: 12 }} />
            {trip.orderIds.map((id, i) => {
              const o = orders.find((x) => x.id === id)
              if (!o) return null
              return (
                <div className="order" key={id}>
                  <div className="head"><b>Stop {i + 1} • #{o.token}</b><span className={`tag ${o.status}`}>{o.status}</span></div>
                  <div className="items">{o.items?.map((it) => `${it.name} x${it.qty}`).join(', ')}</div>
                  <div className="items">{o.addressLabel} — {o.address}</div>
                  <div className="items">WhatsApp: <a href={`https://wa.me/${o.phone}`}>{(o.phone || '').replace(/[^0-9]/g, '')}</a></div>
                  {o.method === 'cod' && (
                    <label className="switch-row"><span>COD Diterima</span>
                      <input type="checkbox" checked={!!codReceived[id]} onChange={(e) => setCodReceived({ ...codReceived, [id]: e.target.checked })} />
                    </label>
                  )}
                  <div className="field"><label>Foto Bukti</label><input type="file" accept="image/*" onChange={(e) => setProof(e.target.files[0]?.name || 'bukti.jpg')} /></div>
                  <button className="btn block sm orange" onClick={() => finishOrder(id)}>Pesanan Terkirim</button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
