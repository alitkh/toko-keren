// Placeholder content. Ganti dengan produk & promo asli lewat halaman Admin
// setelah Firebase dikonfigurasi. Angka harga dummy, realistis untuk UMKM lokal.
export const DUMMY_BANNERS = [
  { id: 'b1', title: 'Gratis Ongkir', sub: 'Min. belanja Rp 50rb', emoji: '🚚', bg: 'linear-gradient(120deg,#1B2A4A,#33507F)' },
  { id: 'b2', title: 'Flash Sale Harian', sub: 'Diskon sampai 50%', emoji: '⚡', bg: 'linear-gradient(120deg,#FF7A1A,#FF9D4D)' },
  { id: 'b3', title: 'Paket Hemat', sub: 'Beli 3 lebih murah', emoji: '🎁', bg: 'linear-gradient(120deg,#2E7D5B,#4CA985)' },
]

export const CATEGORIES = [
  { id: 'all', label: 'Semua', emoji: '🛍️' },
  { id: 'makanan', label: 'Makanan', emoji: '🍚' },
  { id: 'minuman', label: 'Minuman', emoji: '🥤' },
  { id: 'snack', label: 'Snack', emoji: '🍪' },
  { id: 'sayur', label: 'Sayur', emoji: '🥬' },
  { id: 'dessert', label: 'Dessert', emoji: '🍰' },
]

export const SORTS = [
  { id: 'default', label: 'Urutkan' },
  { id: 'low', label: 'Termurah' },
  { id: 'high', label: 'Termahal' },
  { id: 'stock', label: 'Stok' },
]

export const DUMMY_PRODUCTS = [
  { id: 'p1', name: 'Nasi Box Ayam', emoji: '🍱', price: 25000, flashPrice: 21000, flash: true, cat: 'makanan', stock: 25, desc: 'Nasi hangat dengan ayam goreng, lalapan, dan sambal. Cocok untuk makan siang.' },
  { id: 'p2', name: 'Roti Sobek Cokelat', emoji: '🥐', price: 15000, cat: 'makanan', stock: 30, desc: 'Roti lembut isi cokelat lumer, fresh dari oven.' },
  { id: 'p3', name: 'Kopi Susu Gula Aren', emoji: '☕', price: 18000, flashPrice: 14000, flash: true, cat: 'minuman', stock: 40, desc: 'Kopi arabika dengan susu segar dan gula aren asli.' },
  { id: 'p4', name: 'Es Teh Manis', emoji: '🧋', price: 8000, flashPrice: 6000, flash: true, cat: 'minuman', stock: 50, desc: 'Es teh manis segar, seduh dari daun teh pilihan.' },
  { id: 'p5', name: 'Pisang Goreng Crispy', emoji: '🍌', price: 12000, cat: 'snack', stock: 20, desc: 'Pisang goreng tepung crispy, renyah di luar lembut di dalam.' },
  { id: 'p6', name: 'Martabak Manis', emoji: '🥞', price: 22000, cat: 'snack', stock: 18, desc: 'Martabak manis berlumur cokelat dan kacang, tebal dan legit.' },
  { id: 'p7', name: 'Mie Ayam Bakso', emoji: '🍜', price: 17000, cat: 'makanan', stock: 28, desc: 'Mie ayam dengan bakso sapi dan kuah kaldu gurih.' },
  { id: 'p8', name: 'Soto Ayam', emoji: '🍲', price: 19000, cat: 'makanan', stock: 22, desc: 'Soto ayam kuning dengan suwiran ayam dan taburan kriuk.' },
  { id: 'p9', name: 'Ayam Goreng Lengkuas', emoji: '🍗', price: 20000, cat: 'makanan', stock: 24, desc: 'Ayam goreng bumbu lengkuas, gurih dan renyah.' },
  { id: 'p10', name: 'Jus Jeruk', emoji: '🍊', price: 14000, cat: 'minuman', stock: 35, desc: 'Jus jeruk peras tanpa gula tambahan, segar alami.' },
  { id: 'p11', name: 'Es Campur', emoji: '🍧', price: 16000, cat: 'minuman', stock: 19, desc: 'Es campur dengan cincau, pacar, dan sirup gula merah.' },
  { id: 'p12', name: 'Cappuccino Dingin', emoji: '🥤', price: 20000, cat: 'minuman', stock: 26, desc: 'Kopi susu dingin dengan foam lembut di atasnya.' },
  { id: 'p13', name: 'Cireng Isi', emoji: '🥟', price: 10000, cat: 'snack', stock: 40, desc: 'Cireng kenyal isi ayam suwir pedas.' },
  { id: 'p14', name: 'Tahu Isi', emoji: '🥠', price: 9000, cat: 'snack', stock: 45, desc: 'Tahu goreng isi sayuran, renyah dan gurih.' },
  { id: 'p15', name: 'Sayur Asem', emoji: '🥬', price: 13000, cat: 'sayur', stock: 21, desc: 'Sayur asem segar dengan kacang panjang dan melinjo.' },
  { id: 'p16', name: 'Capcay Kuah', emoji: '🥗', price: 18000, cat: 'sayur', stock: 17, desc: 'Capcay sayur segar dengan kuah kaldu ayam.' },
  { id: 'p17', name: 'Klepon', emoji: '🍡', price: 11000, cat: 'dessert', stock: 33, desc: 'Klepon ketan gula merah balur kelapa parut.' },
  { id: 'p18', name: 'Es Krim Cup', emoji: '🍨', price: 12000, cat: 'dessert', stock: 38, desc: 'Es krim cup vanilla-cokelat, dingin dan lembut.' },
]
