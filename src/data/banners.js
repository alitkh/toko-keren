import { useEffect, useState } from 'react'
import { db, collection, getDocs, onSnapshot, addDoc, deleteDoc, doc } from '../firebase.js'

const LS_BANNERS = 'milstime_banners'
export function useBanners() {
  const [banners, setBanners] = useState(() => {
    try { if (typeof window !== 'undefined') { const r = window.localStorage.getItem(LS_BANNERS); if (r) return JSON.parse(r) } } catch (e) {}
    return []
  })
  const [loading, setLoading] = useState(() => {
    try { if (typeof window !== 'undefined') { return !window.localStorage.getItem(LS_BANNERS) } } catch (e) {}
    return true
  })

  useEffect(() => {
    if (!db) { setBanners([]); setLoading(false); return }
    const unsub = onSnapshot(collection(db, 'banners'), (s) => {
      const data = s.docs.map((d) => ({ id: d.id, ...d.data() }))
      setBanners(data)
      try { if (typeof window !== 'undefined') window.localStorage.setItem(LS_BANNERS, JSON.stringify(data)) } catch (e) {}
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return { banners, loading }
}

export async function addBanner(data) {
  if (!db) return
  await addDoc(collection(db, 'banners'), data)
}

export async function deleteBanner(id) {
  if (!db) return
  await deleteDoc(doc(db, 'banners', id))
}
