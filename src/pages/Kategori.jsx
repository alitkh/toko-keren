import { useNavigate } from 'react-router-dom'
import { useCategories } from '../data/categories.js'

export default function Kategori() {
  const navigate = useNavigate()
  const { cats } = useCategories()
  const list = cats.length ? cats : []
  return (
    <div className="wrap" style={{ paddingTop: 16 }}>
      <div className="section-title">Kategori</div>
      <div className="cat-grid">
        {list.map((c) => (
          <button key={c.id} className="cat-card" onClick={() => navigate('/?cat=' + c.id)}>
            <span className="cat-card-emoji">{c.emoji || '📦'}</span>
            <span className="cat-card-name">{c.name || c.label}</span>
          </button>
        ))}
        {list.length === 0 && <p className="muted">Belum ada kategori.</p>}
      </div>
    </div>
  )
}
