'use client'

import { useEffect, useRef } from 'react'
import { GoogleMap, Marker, useJsApiLoader } from '@react-google-maps/api'
import type { LatestLocation, Audience } from '@/types/portal'
import type { SupabaseClient } from '@supabase/supabase-js'

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

interface Props {
  latestLocation: LatestLocation
  dropoffAddressLine: string | null
  audience: Audience
  deliveryId: string
  supabase: SupabaseClient
}

export default function MapPanel({ latestLocation, audience, deliveryId, supabase }: Props) {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
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

        await supabase.rpc('insert_driver_location_from_session', {
          p_delivery_id: deliveryId,
          p_latitude: pos.coords.latitude,
          p_longitude: pos.coords.longitude,
          p_accuracy_meters: pos.coords.accuracy ?? null,
          p_recorded_at: new Date(pos.timestamp).toISOString(),
        })

        lastPublishedAt.current = now
        lastCoords.current = { lat: pos.coords.latitude, lng: pos.coords.longitude }
      },
      (err) => console.error('geolocation error', err),
      { enableHighAccuracy: true, maximumAge: 5_000 },
    )

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current)
      }
    }
  }, [audience, deliveryId, supabase])

  if (!isLoaded) {
    return (
      <div className="h-48 bg-gray-100 rounded-xl animate-pulse border" />
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
