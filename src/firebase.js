import { initializeApp } from 'firebase/app'
import { getAuth, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'
import { getFirestore, collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc, query, where, orderBy, onSnapshot, initializeFirestore, CACHE_SIZE_UNLIMITED } from 'firebase/firestore'
import { getDatabase, ref, set, onValue, push } from 'firebase/database'
import { getStorage, ref as sRef, uploadBytes, getDownloadURL } from 'firebase/storage'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID,
  databaseURL: import.meta.env.VITE_FB_DATABASE_URL,
}

// Jika .env belum diisi, jangan inisialisasi Firebase agar UI tetap bisa render.
// Isi .env dari Firebase console supaya fitur login/order/tracking jalan.
const configured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId)
let app = null, auth = null, db = null, rtdb = null, storage = null
if (configured) {
  app = initializeApp(firebaseConfig)
  auth = getAuth(app)
  try {
    db = initializeFirestore(app, { localCache: { kind: 'persistent', cacheSizeBytes: CACHE_SIZE_UNLIMITED } })
  } catch (e) {
    db = getFirestore(app)
  }
  rtdb = getDatabase(app)
  try { storage = getStorage(app) } catch (e) { storage = null; console.warn('[firebase] Storage belum aktif:', e.message) }
} else {
  console.warn('[firebase] .env belum diisi — fitur Firebase nonaktif. UI tetap bisa dilihat.')
}

// Upload gambar HANYA ke Cloudinary (unsigned). Tidak ada fallback Firebase Storage / base64.
// File dikompres dulu di browser (resize + JPEG) sebelum dikirim, lalu Cloudinary simpan.
// Mengembalikan secure_url yang disimpan ke Firestore.
const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const CLOUD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET

// Kompres + resize di browser (maks sisi panjang 1400px, JPEG q0.8). Balikin Blob.
function compressFile(file, maxSide = 1400, quality = 0.8) {
  return new Promise((resolve) => {
    if (typeof document === 'undefined' || !file.type.startsWith('image/')) return resolve(file)
    const fr = new FileReader()
    fr.onload = () => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img
        if (width > maxSide || height > maxSide) {
          if (width >= height) { height = Math.round(height * maxSide / width); width = maxSide }
          else { width = Math.round(width * maxSide / height); height = maxSide }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        canvas.toBlob((blob) => resolve(blob && blob.size < file.size ? blob : file), 'image/jpeg', quality)
      }
      img.onerror = () => resolve(file)
      img.src = fr.result
    }
    fr.onerror = () => resolve(file)
    fr.readAsDataURL(file)
  })
}

export async function uploadImage(file, path) {
  if (!file) return ''
  if (!file.type || !file.type.startsWith('image/')) throw new Error('File bukan gambar')
  if (file.size > 10 * 1024 * 1024) throw new Error('Ukuran maksimal 10 MB')
  if (!CLOUD_NAME || !CLOUD_PRESET) throw new Error('Cloudinary belum dikonfigurasi (.env)')

  const compressed = await compressFile(file)
  const form = new FormData()
  form.append('file', compressed)
  form.append('upload_preset', CLOUD_PRESET)
  if (path) form.append('folder', path.split('/')[0] || 'lospecados')
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: form })
  if (!res.ok) { const t = await res.text(); throw new Error('Cloudinary gagal: ' + t.slice(0, 140)) }
  const data = await res.json()
  // Sisipkan transformasi auto-optimize (q_auto,f_auto) ke URL agar loading ringan di device pembeli.
  return (data.secure_url || '').replace('/image/upload/', '/image/upload/q_auto,f_auto/')
}

export { auth, db, rtdb, storage, configured }
export {
  signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup,
  collection, doc, getDoc, getDocs, addDoc, setDoc, updateDoc, deleteDoc,
  query, where, orderBy, onSnapshot,
  ref, set, onValue, push,
  sRef, uploadBytes, getDownloadURL,
}
