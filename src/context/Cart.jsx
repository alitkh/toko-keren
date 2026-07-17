import { createContext, useContext, useState, useEffect } from 'react'

const CartCtx = createContext(null)

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('milstime_cart') || '{}') } catch { return {} }
  })
  useEffect(() => { localStorage.setItem('milstime_cart', JSON.stringify(cart)) }, [cart])

  const add = (id) => setCart((c) => ({ ...c, [id]: (c[id] || 0) + 1 }))
  const sub = (id) => setCart((c) => { const n = { ...c }; n[id] = (n[id] || 0) - 1; if (!n[id]) delete n[id]; return n })
  const remove = (id) => setCart((c) => { const n = { ...c }; delete n[id]; return n })
  const clear = () => setCart({})
  const totalQty = Object.values(cart).reduce((a, b) => a + b, 0)

  return (
    <CartCtx.Provider value={{ cart, add, sub, remove, clear, totalQty }}>
      {children}
    </CartCtx.Provider>
  )
}

export const useCart = () => useContext(CartCtx)
