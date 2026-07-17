import { useEffect, useState } from 'react'
import { db, collection, getDocs, onSnapshot } from '../firebase.js'
import { DUMMY_PRODUCTS } from './dummy.js'

const LS_PRODUCTS = 'milstime_products'

export function useProducts() {
  const [products, setProducts] = useState(() => {
    try { if (typeof window !== 'undefined') { const r = window.localStorage.getItem(LS_PRODUCTS); if (r) return JSON.parse(r) } } catch (e) {}
    return []
  })
  const [loading, setLoading] = useState(() => {
    try { if (typeof window !== 'undefined') { return !window.localStorage.getItem(LS_PRODUCTS) } } catch (e) {}
    return true
  })

  useEffect(() => {
    let active = true
    if (!db) { setProducts(DUMMY_PRODUCTS); setLoading(false); return }
    // Coba cache lokal dulu (instant), lalu sync real-time via onSnapshot
    const ref = collection(db, 'products')
    getDocs(ref).then((s) => {
      const list = s.docs.map((d) => ({ id: d.id, ...d.data() }))
      if (active) { setProducts(list.length ? list : DUMMY_PRODUCTS); setLoading(false) }
    }).catch(() => { if (active) { setLoading(false) } })
    const unsub = onSnapshot(ref, (s) => {
      const list = s.docs.map((d) => ({ id: d.id, ...d.data() }))
      if (!active) return
      setProducts(list.length ? list : DUMMY_PRODUCTS)
      setLoading(false)
      try { if (typeof window !== 'undefined') window.localStorage.setItem(LS_PRODUCTS, JSON.stringify(list.length ? list : DUMMY_PRODUCTS)) } catch (e) {}
    })
    return () => { active = false; unsub() }
  }, [])

  return { products, loading }
}
