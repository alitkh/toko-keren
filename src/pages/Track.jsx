import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { doc, getDoc, onSnapshot, ref, onValue, db, rtdb } from '../firebase.js'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import { demo } from '../data/demoStore.js'

export default function Track() {
  const { token } = useParams()
  const [order, setOrder] = useState(null)
  const [pos, setPos] = useState(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    demo.init()
    if (db) {
      const d = doc(db, 'orders', token)
      getDoc(d).then((s) => { if (s.exists()) setOrder({ id: s.id, ...s.data() }); else setOrder({ notfound: true }) })
      return onSnapshot(d, (s) => { if (s.exists()) setOrder({ id: s.id, ...s.data() }) })
    }
    // demo mode
    const o = demo.getOrders().find((x) => x.token === token)
    setOrder(o ? { id: o.token, ...o } : { notfound: true })
  }, [token])

  useEffect(() => {
    if (!order || order.notfound) return
    if (!mapRef.current) {
      const el = document.getElementById('map')
      if (!el) return
      mapRef.current = L.map(el, { zoomControl: false }).setView([-6.2, 106.8], 13)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapRef.current)
    }
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [order])

  useEffect(() => {
    if (rtdb) {
      const r = ref('tracking/' + token + '/position')
      return onValue(r, (snap) => { const v = snap.val(); if (v && v.lat != null) { setPos(v); moveMarker(v) } else setPos(null) })
    }
    return demo.subscribeTrack(token, (v) => { if (v && v.lat != null) { setPos(v); moveMarker(v) } else setPos(null) })
  }, [token])

  function moveMarker(v) {
    if (!mapRef.current) return
    if (!markerRef.current) markerRef.current = L.marker([v.lat, v.lng]).addTo(mapRef.current)
    else markerRef.current.setLatLng([v.lat, v.lng])
    mapRef.current.setView([v.lat, v.lng], 15)
  }

  if (order?.notfound) return <div className="app"><div className="topbar"><div className="brand"><span className="brand-mark"><span className="brand-mils">mils</span><span className="brand-time">time</span><span className="brand-line" /></span></div><span className="owner-tag">Lacak</span></div><div className="wrap"><div className="empty"><div className="big">🔍</div>Kode lacak tidak ditemukan.</div></div></div>
  if (!order) return <div className="app"><div className="topbar"><div className="brand"><span className="brand-mark"><span className="brand-mils">mils</span><span className="brand-time">time</span><span className="brand-line" /></span></div><span className="owner-tag">Lacak</span></div><div className="wrap"><div className="empty"><div className="big">⏳</div>Memuat…</div></div></div>

  return (
    <div className="app">
      <div className="topbar"><div className="brand"><span className="brand-mark"><span className="brand-mils">mils</span><span className="brand-time">time</span><span className="brand-line" /></span></div><span className="owner-tag">Lacak #{order.token}</span></div>
      <div className="wrap">
        <div className="card" style={{ marginBottom: 12 }}>
          <div className="head" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b>{order.customerName}</b><span className={`tag ${order.status}`}>{order.status}</span>
          </div>
          <div className="items" style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>{order.items?.map((i) => `${i.name} x${i.qty}`).join(', ')}</div>
          <div className="items" style={{ fontSize: 13, color: 'var(--muted)' }}>{order.address}</div>
        </div>
        <div id="map" />
        <div className="card" style={{ marginTop: 12, fontSize: 14 }}>
          {pos
            ? <><span style={{ color: 'var(--orange)', fontWeight: 700 }}>● Kurir dalam perjalanan</span><div className="muted" style={{ marginTop: 4 }}>GPS: {pos.lat.toFixed(4)}, {pos.lng.toFixed(4)}</div></>
            : <span className="muted">Kurir belum mulai mengirim atau sudah sampai.</span>}
        </div>
      </div>
    </div>
  )
}
