'use client'

import { useEffect, useRef } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import type { DeliveryState } from '@/lib/delivery-state'
import type { Audience } from '@/types/portal'

const MIN_INTERVAL_MS = 10_000   // 10 seconds minimum between publishes
const MIN_DISTANCE_M  = 20       // 20 meters minimum displacement

// Haversine formula — great-circle distance in metres
function haversineDistance(
  prev: { lat: number; lng: number },
  next: GeolocationCoordinates,
): number {
  const R = 6_371_000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(next.latitude - prev.lat)
  const dLon = toRad(next.longitude - prev.lng)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(prev.lat)) * Math.cos(toRad(next.latitude)) * Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

type LatestLocation = NonNullable<DeliveryState['latestLocation']>

interface Props {
  /** Non-null guaranteed by parent (DeliveryPortalRoot renders MapPanel only when latestLocation is non-null) */
  latestLocation: LatestLocation
  dropoffAddressLine: string | null  // Reserved for future dropoff marker — not yet consumed
  audience: Audience
  deliveryId: string
  portalSessionToken: string
}

export default function MapPanel({ latestLocation, audience, deliveryId: _deliveryId, portalSessionToken }: Props) {
  const mapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: mapsApiKey ?? '',
  })

  const lastPublishedAt = useRef<number>(0)
  const lastCoords = useRef<{ lat: number; lng: number } | null>(null)
  const watchId = useRef<number | null>(null)

  useEffect(() => {
    if (audience !== 'driver') return
    if (!navigator.geolocation) return

    watchId.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const now = Date.now()
        if (now - lastPublishedAt.current < MIN_INTERVAL_MS) return
        if (
          lastCoords.current &&
          haversineDistance(lastCoords.current, pos.coords) < MIN_DISTANCE_M
        ) return

        const backendUrl = process.env.NEXT_PUBLIC_DELIVERY_BACKEND_URL
        const res = await fetch(`${backendUrl}/api/external/delivery/location`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${portalSessionToken}`,
          },
          body: JSON.stringify({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracyMeters: pos.coords.accuracy ?? null,
            recordedAt: new Date(pos.timestamp).toISOString(),
          }),
        })

        if (!res.ok) {
          console.error('[MapPanel] location publish failed — throttle state not advanced')
          return
        }

        lastPublishedAt.current = now
        lastCoords.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      },
      (err) => console.error('geolocation error', err),
      { enableHighAccuracy: true, maximumAge: 5_000, timeout: 15_000 },
    )

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [audience, portalSessionToken])

  if (!isLoaded) {
    return (
      <div className="h-48 bg-gray-100 rounded-xl animate-pulse border" />
    )
  }

  if (!mapsApiKey) {
    return (
      <div className="h-48 bg-gray-100 rounded-xl border flex items-center justify-center">
        <p className="text-xs text-gray-400">Mapa não disponível</p>
      </div>
    )
  }

  const center = { lat: latestLocation.lat, lng: latestLocation.lng }

  return (
    <div className="rounded-xl overflow-hidden border h-48">
      <GoogleMap
        zoom={15}
        center={center}
        mapContainerStyle={{ width: '100%', height: '100%' }}
        options={{ disableDefaultUI: true, zoomControl: true }}
      >
        <Marker position={center} title="Entregador" />
      </GoogleMap>
    </div>
  )
}
