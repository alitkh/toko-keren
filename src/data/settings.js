import { useEffect, useState } from 'react'
import { db, doc, getDoc, onSnapshot, setDoc } from '../firebase.js'

export function useSettings() {
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!db) { setLoading(false); return }
    const ref = doc(db, 'settings', 'store')
    const unsub = onSnapshot(ref, (s) => {
      setSettings(s.exists() ? s.data() : {
        brandName: 'mils time', logoEmoji: '🍱', navy: '#1B2A4A', orange: '#FF7A1A', flashOn: false, flashEnd: ''
      })
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return { settings, loading }
}

export async function saveSettings(data) {
  if (!db) return
  await setDoc(doc(db, 'settings', 'store'), data, { merge: true })
}
