import { useRef, useState } from 'react'
import { uploadImage } from '../firebase.js'
import { CloudArrowUp, Spinner } from '@phosphor-icons/react'

export default function ImageUpload({ value, onChange, folder, label, recommend, height = 120 }) {
  const inputRef = useRef(null)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')

  async function onFile(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    setBusy(true); setErr('')
    if (file.size > 10 * 1024 * 1024) { setErr('Ukuran maksimal 10 MB'); setBusy(false); return }
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const url = await uploadImage(file, `${folder}/${Date.now()}_${safe}`)
      onChange(url)
    } catch (er) {
      setErr(er.message || 'Gagal upload')
    } finally {
      setBusy(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="upload">
      <div className="upload-label">{label}</div>
      <div className="upload-drop" style={{ height }} onClick={() => !busy && inputRef.current.click()}>
        {busy ? (
          <div className="upload-busy"><Spinner size={22} className="spin" /> Mengunggah…</div>
        ) : value ? (
          <img src={value} alt={label} className="upload-img" />
        ) : (
          <div className="upload-placeholder">
            <CloudArrowUp size={26} />
            <span>Ketuk untuk unggah</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" hidden onChange={onFile} />
      </div>
      {value && !busy && (
        <button type="button" className="upload-clear" onClick={() => onChange('')}>Hapus foto</button>
      )}
      {recommend && <div className="upload-reco">📐 {recommend}</div>}
      {err && <div className="upload-err">{err}</div>}
    </div>
  )
}
