import { useEffect, useState } from 'react'
import { db, collection, getDocs, onSnapshot, addDoc, deleteDoc, doc } from '../firebase.js'

export function useBanners() {
  const [banners, setBanners] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db) { setLoading(false); return }
    const unsub = onSnapshot(collection(db, 'banners'), (s) => {
      setBanners(s.docs.map((d) => ({ id: d.id, ...d.data() })))
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
