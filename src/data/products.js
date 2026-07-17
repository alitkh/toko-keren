import { useEffect, useState } from 'react'
import { db, collection, getDocs } from '../firebase.js'
import { DUMMY_PRODUCTS } from './dummy.js'

export function useProducts() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    if (!db) { setProducts(DUMMY_PRODUCTS); setLoading(false); return }
    getDocs(collection(db, 'products'))
      .then((s) => {
        const list = s.docs.map((d) => ({ id: d.id, ...d.data() }))
        if (active) { setProducts(list.length ? list : DUMMY_PRODUCTS); setLoading(false) }
      })
      .catch(() => { if (active) { setProducts(DUMMY_PRODUCTS); setLoading(false) } })
    return () => { active = false }
  }, [])

  return { products, loading }
}
