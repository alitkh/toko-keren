// Lapisan demo offline (localStorage) — pengganti Firebase saat .env belum diisi.
// Meniru bentuk data agar Admin/Courier/Track langsung fungsional tanpa creds.
// Bila firebase.js sudah terkonfigurasi (db != null), komponen tetap pakai Firebase.

const hasLS = typeof window !== 'undefined' && typeof localStorage !== 'undefined'
const K = {
  products: 'lospecados_products',
  couriers: 'lospecados_couriers',
  orders: 'lospecados_orders',
  track: 'lospecados_track',
  cats: 'lospecados_cats',
}

const read = (key, fallback) => {
  if (!hasLS) return fallback
  try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)) } catch { return fallback }
}
const write = (key, val) => { if (hasLS) localStorage.setItem(key, JSON.stringify(val)) }

const seed = () => {
  if (!hasLS) return
  if (!localStorage.getItem(K.products)) {
    write(K.products, [
      { id: 'p1', name: 'Dimsum Ayam', price: 3000, stock: 50, emoji: '🥟', desc: 'Dimsum ayam original' },
      { id: 'p2', name: 'Dimsum Udang', price: 4000, stock: 40, emoji: '🍤', desc: 'Dimsum udang segar' },
      { id: 'p3', name: 'Siomay', price: 3500, stock: 30, emoji: '🥠', desc: 'Siomay ikan' },
    ])
  }
  if (!localStorage.getItem(K.couriers)) {
    write(K.couriers, [
      { id: 'c1', name: 'Budi', phone: '0812-xxx', isActive: true },
      { id: 'c2', name: 'Andi', phone: '0813-xxx', isActive: true },
    ])
  }
}

export const demo = {
  init: seed,
  // Products
  getProducts() { return read(K.products, []) },
  saveProduct(p) {
    const list = this.getProducts()
    if (p.id) { const i = list.findIndex((x) => x.id === p.id); if (i >= 0) list[i] = { ...list[i], ...p } }
    else { p.id = 'p' + Date.now().toString(36); list.push(p) }
    write(K.products, list); return p
  },
  deleteProduct(id) { write(K.products, this.getProducts().filter((x) => x.id !== id)) },
  // Categories (demo)
  getCategories() { return read(K.cats, [{ id: 'c1', name: 'Makanan', emoji: '🍔', image: '', active: true }, { id: 'c2', name: 'Minuman', emoji: '🥤', image: '', active: true }]) },
  addCategory(c) { const list = this.getCategories(); c.id = 'c' + Date.now().toString(36); list.push(c); write(K.cats, list); return c },
  updateCategory(id, patch) { const list = this.getCategories().map((x) => (x.id === id ? { ...x, ...patch } : x)); write(K.cats, list); return list },
  deleteCategory(id) { write(K.cats, this.getCategories().filter((x) => x.id !== id)) },
  // Couriers
  getCouriers() { return read(K.couriers, []) },
  addCourier(c) { const list = this.getCouriers(); c.id = 'c' + Date.now().toString(36); list.push(c); write(K.couriers, list); return c },
  // Orders (shared dengan Cart.jsx via milstime_orders)
  getOrders() { return read('milstime_orders', []) },
  saveOrders(list) { write('milstime_orders', list) },
  updateOrder(token, patch) { const list = this.getOrders().map((o) => (o.token === token ? { ...o, ...patch } : o)); this.saveOrders(list); return list },
  // Tracking GPS
  getTrack(token) { return read(K.track, {})[token] || null },
  setTrack(token, pos) { const all = read(K.track, {}); all[token] = pos; write(K.track, all) },
  subscribeTrack(token, cb) {
    if (!hasLS) { cb(null); return () => {} }
    const handler = (e) => { if (e.key === K.track) { const all = JSON.parse(e.newValue || '{}'); cb(all[token] || null) } }
    window.addEventListener('storage', handler)
    cb(this.getTrack(token))
    return () => window.removeEventListener('storage', handler)
  },
  // Login sederhana (demo) — cukup isi email apa pun
  login(email) { if (hasLS) localStorage.setItem('lospecados_user', email); return email },
  logout() { if (hasLS) localStorage.removeItem('lospecados_user') },
  currentUser() { return hasLS ? localStorage.getItem('lospecados_user') : null },
}
