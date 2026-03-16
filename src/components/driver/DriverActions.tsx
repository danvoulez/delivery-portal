'use client'

import { useState } from 'react'
import type { DeliveryStatus } from '@/types/portal'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NEXT_STATUS } from '@/lib/pipeline-steps'
import ProofAttachment from './ProofAttachment'

interface Props {
  status: DeliveryStatus
  deliveryId: string
  portalSessionToken: string
  supabase: SupabaseClient
  onStatusUpdate: (status: DeliveryStatus, updated_at: string) => void
  onProofAttached: (proof_file_id: string) => void
}

const STATUS_LABEL: Partial<Record<DeliveryStatus, string>> = {
  en_route_pickup:  'Cheguei ao local de coleta',
  picked_up:        'Pacote coletado',
  en_route_dropoff: 'A caminho da entrega',
  delivered:        'Entrega realizada',
}

export default function DriverActions({
  status,
  deliveryId,
  portalSessionToken,
  supabase,
  onStatusUpdate,
  onProofAttached,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const nextStatus = NEXT_STATUS[status]

  const advance = async () => {
    if (!nextStatus || loading) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/external/delivery/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${portalSessionToken}`,
        },
        body: JSON.stringify({ nextStatus, proofFileId: null }),
      })

      if (!res.ok) {
        setError('Não foi possível atualizar o status. Tente novamente.')
        return
      }

      // status endpoint returns 204 No Content — use client time for optimistic update
      onStatusUpdate(nextStatus, new Date().toISOString())
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-xl border p-4 space-y-4">
      {nextStatus && (
        <button
          onClick={advance}
          disabled={loading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium text-sm disabled:opacity-50 active:bg-blue-700 transition-colors"
        >
          {loading
            ? 'Atualizando...'
            : `→ ${STATUS_LABEL[nextStatus] ?? nextStatus}`}
        </button>
      )}

      {status === 'en_route_dropoff' && (
        <ProofAttachment
          deliveryId={deliveryId}
          supabase={supabase}
          portalSessionToken={portalSessionToken}
          onProofAttached={onProofAttached}
        />
      )}

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  )
}
