import { useEffect, useState } from 'react'
import {
  auth, db,
  createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut as fbSignOut,
  GoogleAuthProvider, signInWithPopup,
} from '../firebase.js'
import { doc, setDoc, getDoc } from '../firebase.js'

// Customer auth: email + password (Firebase) dengan fallback demo (localStorage).
const LS_USER = 'lospecados_user'

export function useCustomer() {
  const [user, setUser] = useState(() => {
    try { if (typeof window !== 'undefined') { const r = window.localStorage.getItem(LS_USER); if (r) return JSON.parse(r) } } catch (e) {}
    return null
  })
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (!db) return
    const unsub = auth.onAuthStateChanged((u) => {
      if (u) {
        const data = { uid: u.uid, email: u.email, name: u.displayName || '' }
        setUser(data)
        try { if (typeof window !== 'undefined') window.localStorage.setItem(LS_USER, JSON.stringify(data)) } catch (e) {}
      } else {
        setUser(null)
      }
    })
    return () => unsub()
  }, [])

  async function register(email, password, name) {
    setErr(''); setLoading(true)
    try {
      if (db) {
        const cred = await createUserWithEmailAndPassword(auth, email, password)
        const data = { uid: cred.user.uid, email, name: name || '' }
        await setDoc(doc(db, 'users', cred.user.uid), { email, name: name || '', phone: '', address: '' }, { merge: true })
        setUser(data)
        try { if (typeof window !== 'undefined') window.localStorage.setItem(LS_USER, JSON.stringify(data)) } catch (e) {}
        return true
      }
      // demo mode
      const data = { uid: 'demo', email, name: name || '' }
      setUser(data)
      try { if (typeof window !== 'undefined') window.localStorage.setItem(LS_USER, JSON.stringify(data)) } catch (e) {}
      return true
    } catch (e) {
      setErr((e?.code || '').replace('auth/', '') || e?.message || 'Gagal daftar')
      return false
    } finally { setLoading(false) }
  }

  async function login(email, password) {
    setErr(''); setLoading(true)
    try {
      if (db) {
        const cred = await signInWithEmailAndPassword(auth, email, password)
        const data = { uid: cred.user.uid, email, name: cred.user.displayName || '' }
        setUser(data)
        try { if (typeof window !== 'undefined') window.localStorage.setItem(LS_USER, JSON.stringify(data)) } catch (e) {}
        return true
      }
      const data = { uid: 'demo', email, name: '' }
      setUser(data)
      try { if (typeof window !== 'undefined') window.localStorage.setItem(LS_USER, JSON.stringify(data)) } catch (e) {}
      return true
    } catch (e) {
      setErr((e?.code || '').replace('auth/', '') || e?.message || 'Gagal login')
      return false
    } finally { setLoading(false) }
  }

  async function loginWithGoogle() {
    setErr(''); setLoading(true)
    try {
      if (!db) {
        const data = { uid: 'demo', email: 'demo@google.com', name: 'Google User' }
        setUser(data)
        try { if (typeof window !== 'undefined') window.localStorage.setItem(LS_USER, JSON.stringify(data)) } catch (e) {}
        return true
      }
      const cred = await signInWithPopup(auth, new GoogleAuthProvider())
      const u = cred.user
      const data = { uid: u.uid, email: u.email, name: u.displayName || '' }
      await setDoc(doc(db, 'users', u.uid), { email: u.email, name: u.displayName || '', phone: '', address: '' }, { merge: true })
      setUser(data)
      try { if (typeof window !== 'undefined') window.localStorage.setItem(LS_USER, JSON.stringify(data)) } catch (e) {}
      return true
    } catch (e) {
      setErr((e?.code || '').replace('auth/', '') || e?.message || 'Login Google gagal')
      return false
    } finally { setLoading(false) }
  }

  function logout() {
    if (db) fbSignOut(auth).catch(() => {})
    setUser(null)
    try { if (typeof window !== 'undefined') window.localStorage.removeItem(LS_USER) } catch (e) {}
  }

  return { user, loading, err, register, login, logout, loginWithGoogle }
}

export async function saveUserProfile(uid, data) {
  if (!db) { try { if (typeof window !== 'undefined') window.localStorage.setItem('lospecados_profile_' + uid, JSON.stringify(data)) } catch (e) {}; return }
  await setDoc(doc(db, 'users', uid), data, { merge: true })
}

export async function getUserProfile(uid) {
  if (!db) { try { if (typeof window !== 'undefined') { const r = window.localStorage.getItem('lospecados_profile_' + uid); if (r) return JSON.parse(r) } } catch (e) {}; return null }
  const s = await getDoc(doc(db, 'users', uid))
  return s.exists() ? s.data() : null
}
