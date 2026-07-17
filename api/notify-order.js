// Vercel serverless function: kirim notifikasi order baru ke Telegram admin.
// Trigger dari Cart checkout (fetch POST /api/notify-order).
// Env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID (di Vercel dashboard).
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'Method not allowed' })
  try {
    const o = req.body || {}
    const token = process.env.TELEGRAM_BOT_TOKEN
    const chatId = process.env.TELEGRAM_CHAT_ID
    if (!token || !chatId) return res.status(200).json({ ok: false, skipped: true, reason: 'Telegram env belum diisi' })
    const text = `🛒 *Pesanan Baru #${o.token || '-'}*\n` +
      `Nama: ${o.customerName || '-'}\n` +
      `HP: ${o.phone || '-'}\n` +
      `Alamat: ${o.addressLabel || ''} ${o.address || '-'}\n` +
      `Metode: ${o.method || '-'}${o.method === 'cod' ? (o.codReceived ? ' (COD diterima)' : '') : ''}\n` +
      `Total: Rp ${(o.totalPrice || 0).toLocaleString('id-ID')}\n` +
      `Item: ${(o.items || []).map((i) => `${i.name} x${i.qty}`).join(', ')}`
    const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'Markdown' }),
    })
    const j = await r.json()
    return res.status(200).json({ ok: j.ok, telegram: j })
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e.message || e) })
  }
}
