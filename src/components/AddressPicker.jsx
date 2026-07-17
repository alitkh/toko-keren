import { useEffect, useRef } from 'react'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function AddressPicker({ lat, lng, onPick }) {
  const elRef = useRef(null)
  const mapRef = useRef(null)
  const markerRef = useRef(null)

  useEffect(() => {
    if (!elRef.current || mapRef.current) return
    const start = (lat && lng) ? [lat, lng] : [-6.2, 106.816]
    mapRef.current = L.map(elRef.current, { zoomControl: false }).setView(start, 15)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(mapRef.current)
    if (lat && lng) markerRef.current = L.marker(start).addTo(mapRef.current)
    mapRef.current.on('click', async (e) => {
      const { lat: la, lng: ln } = e.latlng
      if (!markerRef.current) markerRef.current = L.marker([la, ln]).addTo(mapRef.current)
      else markerRef.current.setLatLng([la, ln])
      let addr = ''
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${la}&lon=${ln}`)
        const j = await r.json()
        addr = j.display_name || ''
      } catch (e) {}
      onPick({ lat: la, lng: ln, address: addr })
    })
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null } }
  }, [])

  return <div ref={elRef} id="addr-map" style={{ height: 200, borderRadius: 12, marginTop: 8 }} />
}
