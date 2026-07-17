import { useEffect, useState } from 'react'
import { DUMMY_BANNERS } from '../data/dummy.js'

export default function BannerSlider({ banners, flashOn, flashEnd }) {
  const list = banners && banners.length ? banners.map((b) => ({ id: b.id, title: b.title, subtitle: b.subtitle, emoji: b.emoji, image: b.image, bg: b.color || 'linear-gradient(135deg,#1B2A4A,#FF7A1A)' })) : DUMMY_BANNERS
  const [i, setI] = useState(0)
  const n = list.length

  useEffect(() => {
    const reduce = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduce) return
    const t = setInterval(() => setI((p) => (p + 1) % n), 4000)
    return () => clearInterval(t)
  }, [n])

  return (
    <div className="slider">
      <div className="slider-track" style={{ transform: `translateX(-${i * 100}%)` }}>
        {list.map((b) => (
          <div className="slide" key={b.id} style={b.image ? { background: `center/cover no-repeat url(${b.image})` } : { background: b.bg }}>
            {!b.image && <div className="slide-emoji">{b.emoji}</div>}
            <div className="slide-text">
              <div className="slide-title">{b.title}</div>
              <div className="slide-sub">{b.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="dots">
        {list.map((b, idx) => (
          <button key={b.id} className={'dot' + (idx === i ? ' on' : '')} onClick={() => setI(idx)} aria-label={'banner ' + (idx + 1)} />
        ))}
      </div>
    </div>
  )
}
