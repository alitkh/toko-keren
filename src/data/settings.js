import { useEffect, useState } from 'react'
import { db, doc, getDoc, onSnapshot, setDoc } from '../firebase.js'

const LS_SETTINGS = 'milstime_settings'
const DEFAULT_SETTINGS = {
  brandName: 'mils time', logoEmoji: '🍱', navy: '#1B2A4A', orange: '#FF7A1A', flashOn: false, flashEnd: ''
}
export function useSettings() {
  const [settings, setSettings] = useState(() => {
    try { if (typeof window !== 'undefined') { const r = window.localStorage.getItem(LS_SETTINGS); if (r) return JSON.parse(r) } } catch (e) {}
    return null
  })
  const [loading, setLoading] = useState(() => {
    try { if (typeof window !== 'undefined') { return !window.localStorage.getItem(LS_SETTINGS) } } catch (e) {}
    return true
  })

  useEffect(() => {
    if (!db) { setSettings(DEFAULT_SETTINGS); setLoading(false); return }
    const ref = doc(db, 'settings', 'store')
    const unsub = onSnapshot(ref, (s) => {
      const data = s.exists() ? s.data() : DEFAULT_SETTINGS
      setSettings(data)
      try { if (typeof window !== 'undefined') window.localStorage.setItem(LS_SETTINGS, JSON.stringify(data)) } catch (e) {}
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
