import { useEffect, useState } from 'react'
import { db, collection, getDocs, onSnapshot, addDoc, deleteDoc, doc, updateDoc } from '../firebase.js'
import { demo } from '../data/demoStore.js'

export function useCategories() {
  const [cats, setCats] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db) {
      setCats(demo.getCategories())
      setLoading(false)
      return
    }
    const unsub = onSnapshot(collection(db, 'categories'), (s) => {
      setCats(s.docs.map((d) => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return { cats, loading }
}

export async function addCategory(data) {
  if (!db) { demo.addCategory(data); return }
  await addDoc(collection(db, 'categories'), data)
}

export async function updateCategory(id, data) {
  if (!db) { demo.updateCategory(id, data); return }
  await updateDoc(doc(db, 'categories', id), data)
}

export async function deleteCategory(id) {
  if (!db) { demo.deleteCategory(id); return }
  await deleteDoc(doc(db, 'categories', id))
}
