import { useEffect } from 'react'
import { X } from '@phosphor-icons/react'

export default function ProductModal({ product, cartQty, onAdd, onSub, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!product) return null
  const price = product.flashPrice && product.flash ? product.flashPrice : product.price

  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <button className="sheet-close" onClick={onClose} aria-label="Tutup"><X size={22} /></button>
        <div className="sheet-thumb">{product.image ? <img src={product.image} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : product.emoji || '📦'}</div>
        <div className="sheet-name">{product.name}</div>
        {product.flash && <span className="flash-tag center">Flash Sale</span>}
        <div className="sheet-price">
          Rp {price?.toLocaleString('id-ID')}
          {product.flash && <span className="price-old"> Rp {product.price?.toLocaleString('id-ID')}</span>}
        </div>
        <div className="sheet-desc">{product.desc || 'Produk pilihan TokoKita.'}</div>
        <div className="sheet-stock">Stok: {product.stock}</div>
        <div className="sheet-actions">
          {cartQty > 0
            ? <div className="qty"><button className="btn ghost" onClick={onSub}>−</button><b>{cartQty}</b><button className="btn" onClick={onAdd}>+</button></div>
            : <button className="btn block" onClick={onAdd}>Tambahkan keranjang</button>}
        </div>
      </div>
    </div>
  )
}
