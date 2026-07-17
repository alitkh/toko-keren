import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  try {
    const { url } = req.body || {}
    if (!url) return res.status(400).json({ ok: false, error: 'url required' })
    // strip transformasi (q_auto,f_auto, dll) antara /upload/ dan public_id
    let u = String(url).replace(/\/upload\/[^/]+\//, '/upload/')
    const m = u.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/)
    if (!m) return res.status(400).json({ ok: false, error: 'not a cloudinary url' })
    const publicId = m[1]
    const r = await cloudinary.uploader.destroy(publicId)
    return res.status(200).json({ ok: true, result: r })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) })
  }
}
