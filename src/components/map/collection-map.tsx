'use client'

import { useEffect, useRef, useState } from 'react'
import type { CollectionPointDTO } from '@/lib/types'
import { POINT_TYPE_META } from '@/lib/types'

interface MapProps {
  points: CollectionPointDTO[]
  userLocation: {
    latitude: number
    longitude: number
    accuracy: number
  } | null
  onPointClick?: (p: CollectionPointDTO) => void
  onMapClick?: (lat: number, lng: number) => void
  center?: { lat: number; lng: number }
  zoom?: number
  pickingMode?: boolean
  pickedLocation?: { lat: number; lng: number } | null
  className?: string
}

// Custom marker icons using theme colors
function makeIcon(L: any, emoji: string, color: string, highlighted = false) {
  return L.divIcon({
    className: 'ff-marker',
    html: `<div style="
      background: ${color};
      width: ${highlighted ? '40px' : '32px'};
      height: ${highlighted ? '40px' : '32px'};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      border: 2px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-left: ${highlighted ? '-4px' : '0'};
      margin-top: ${highlighted ? '-4px' : '0'};
    "><span style="transform: rotate(45deg); font-size: ${highlighted ? '20px' : '16px'};">${emoji}</span></div>`,
    iconSize: [highlighted ? 40 : 32, highlighted ? 40 : 32],
    iconAnchor: [highlighted ? 20 : 16, highlighted ? 40 : 32],
  })
}

function makeUserIcon(L: any) {
  return L.divIcon({
    className: 'ff-user-marker',
    html: `<div style="
      width: 18px;
      height: 18px;
      background: var(--info, #2563eb);
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(37, 99, 235, 0.2), 0 2px 6px rgba(0,0,0,0.25);
    "></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

function makePickIcon(L: any) {
  return L.divIcon({
    className: 'ff-pick-marker',
    html: `<div style="
      width: 28px;
      height: 28px;
      background: var(--warning, #f59e0b);
      border: 3px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 4px 12px rgba(245,158,11,0.4);
      display:flex;
      align-items:center;
      justify-content:center;
    "><span style="transform: rotate(45deg); color:white; font-weight:bold; font-size:14px;">+</span></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 28],
  })
}

export default function CollectionMap({
  points,
  userLocation,
  onPointClick,
  onMapClick,
  center,
  zoom = 15,
  pickingMode = false,
  pickedLocation,
  className = '',
}: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<any>(null)
  const markersRef = useRef<any[]>([])
  const userMarkerRef = useRef<any>(null)
  const accuracyCircleRef = useRef<any>(null)
  const pickMarkerRef = useRef<any>(null)
  const onPointClickRef = useRef(onPointClick)
  const onMapClickRef = useRef(onMapClick)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    onPointClickRef.current = onPointClick
  }, [onPointClick])
  useEffect(() => {
    onMapClickRef.current = onMapClick
  }, [onMapClick])

  // init map once
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    let cancelled = false

    async function init() {
      const L = (await import('leaflet')).default as typeof import('leaflet')
      await import('leaflet/dist/leaflet.css')

      if (cancelled || !containerRef.current) return

      const initialCenter: [number, number] =
        center ?? (userLocation ? [userLocation.latitude, userLocation.longitude] : [-14.235, -51.9253])

      const map = L.map(containerRef.current, {
        center: initialCenter,
        zoom,
        zoomControl: !pickingMode,
        attributionControl: true,
      })

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map)

      map.on('click', (e: any) => {
        if (onMapClickRef.current) {
          onMapClickRef.current(e.latlng.lat, e.latlng.lng)
        }
      })

      mapRef.current = map
      setReady(true)

      // invalidateSize after mount to handle flexbox layout
      setTimeout(() => {
        if (mapRef.current) mapRef.current.invalidateSize()
      }, 100)
    }

    init()

    return () => {
      cancelled = true
      if (mapRef.current) {
        mapRef.current.remove()
        mapRef.current = null
      }
      setReady(false)
    }
     
  }, [])

  // Invalidate size when container becomes visible (e.g., switching tabs back)
  useEffect(() => {
    if (!ready) return
    const observer = new ResizeObserver(() => {
      if (mapRef.current) {
        mapRef.current.invalidateSize()
      }
    })
    if (containerRef.current) {
      observer.observe(containerRef.current)
    }
    return () => observer.disconnect()
  }, [ready])

  // recenter when center prop changes — but preserve current zoom level
  useEffect(() => {
    if (!mapRef.current || !center) return
    const currentZoom = mapRef.current.getZoom() || zoom
    mapRef.current.setView([center.lat, center.lng], currentZoom)
  }, [center?.lat, center?.lng, zoom])

  // update markers
  useEffect(() => {
    if (!mapRef.current || !ready) return
    let active = true

    async function render() {
      const L = (await import('leaflet')).default as typeof import('leaflet')
      if (!active || !mapRef.current) return

      markersRef.current.forEach((m) => m.remove())
      markersRef.current = []

      points.forEach((p) => {
        const meta = POINT_TYPE_META[p.type]
        const icon = makeIcon(L, meta.emoji, meta.color, p.hasFruit)
        const marker = L.marker([p.latitude, p.longitude], { icon })
        const fruitBadge = p.hasFruit
          ? '<div style="font-size:11px;color:#16a34a;font-weight:600;margin-top:4px;display:flex;align-items:center;gap:2px;">🌱 Com frutos hoje</div>'
          : ''
        marker.bindPopup(
          `<div style="min-width:180px;">
            <div style="font-weight:600;font-size:14px;margin-bottom:4px;">${meta.emoji} ${p.name}</div>
            <div style="font-size:12px;color:#666;">${meta.label} • ${p.ownerName}</div>
            ${fruitBadge}
          </div>`
        )
        marker.on('click', () => {
          if (onPointClickRef.current) onPointClickRef.current(p)
        })
        marker.addTo(mapRef.current)
        markersRef.current.push(marker)
      })
    }
    render()

    return () => {
      active = false
    }
  }, [points, ready])

  // user location marker + accuracy circle
  useEffect(() => {
    if (!mapRef.current || !ready) return
    let active = true

    async function render() {
      const L = (await import('leaflet')).default as typeof import('leaflet')
      if (!active || !mapRef.current) return

      if (userMarkerRef.current) {
        userMarkerRef.current.remove()
        userMarkerRef.current = null
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove()
        accuracyCircleRef.current = null
      }
      if (!userLocation) return

      // Accuracy circle (visual feedback of GPS precision)
      if (userLocation.accuracy && userLocation.accuracy > 0) {
        accuracyCircleRef.current = L.circle(
          [userLocation.latitude, userLocation.longitude],
          {
            radius: userLocation.accuracy,
            color: '#2563eb',
            fillColor: '#2563eb',
            fillOpacity: 0.08,
            weight: 1,
            opacity: 0.3,
          }
        ).addTo(mapRef.current)
      }

      userMarkerRef.current = L.marker([userLocation.latitude, userLocation.longitude], {
        icon: makeUserIcon(L),
        zIndexOffset: 1000,
      })
        .bindPopup(
          `<div style="font-size:13px;">
            <strong>📍 Você está aqui</strong>
            ${userLocation.accuracy ? `<br/><span style="color:#666;font-size:11px;">Precisão: ~${Math.round(userLocation.accuracy)}m</span>` : ''}
          </div>`
        )
        .addTo(mapRef.current)
    }
    render()
    return () => {
      active = false
    }
  }, [userLocation?.latitude, userLocation?.longitude, userLocation?.accuracy, ready])

  // picked location marker
  useEffect(() => {
    if (!mapRef.current || !ready) return
    let active = true

    async function render() {
      const L = (await import('leaflet')).default as typeof import('leaflet')
      if (!active || !mapRef.current) return

      if (pickMarkerRef.current) {
        pickMarkerRef.current.remove()
        pickMarkerRef.current = null
      }
      if (!pickedLocation) return

      pickMarkerRef.current = L.marker([pickedLocation.lat, pickedLocation.lng], {
        icon: makePickIcon(L),
        zIndexOffset: 900,
      })
        .bindPopup('<div style="font-size:13px;">📍 Novo ponto aqui</div>')
        .addTo(mapRef.current)
    }
    render()
    return () => {
      active = false
    }
  }, [pickedLocation?.lat, pickedLocation?.lng, ready])

  return (
    <div
      ref={containerRef}
      className={`w-full h-full ${className}`}
      style={{ minHeight: 200 }}
      role="application"
      aria-label="Mapa de pontos de coleta"
    />
  )
}
