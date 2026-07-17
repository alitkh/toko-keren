import { useEffect, useState } from 'react'

export default function Orders() {
  const [orders, setOrders] = useState([])
  useEffect(() => {
    try { setOrders(JSON.parse(localStorage.getItem('milstime_orders') || '[]').reverse()) } catch { setOrders([]) }
  }, [])

  if (!orders.length) return (
    <div className="empty"><div className="big">📦</div><p>Belum ada pesanan.<br />Yuk belanja di Beranda.</p><a className="btn" href="/">Belanja sekarang</a></div>
  )

  return (
    <>
      <div className="section-title">Pesanan saya ({orders.length})</div>
      {orders.map((o) => (
        <div className="order" key={o.token}>
          <div className="head"><b>#{o.token}</b><span className={`tag ${o.status}`}>{o.status}</span></div>
          <div className="items">{o.items?.map((i) => `${i.name} x${i.qty}`).join(', ')}</div>
          <div className="items">Total: Rp {o.totalPrice?.toLocaleString('id-ID')}</div>
          <div className="items">{new Date(o.createdAt).toLocaleString('id-ID')}</div>
          <div className="row"><a className="btn ghost sm" href={`/track/${o.token}`}>Lacak kurir</a></div>
        </div>
      ))}
    </>
  )
}
