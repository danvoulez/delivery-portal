'use client'

import { useState } from 'react'
import type { DeliveryStatus } from '@/types/portal'
import type { SupabaseClient } from '@supabase/supabase-js'
import { NEXT_STATUS } from '@/lib/pipeline-steps'
import ProofAttachment from './ProofAttachment'

interface Props {
  status: DeliveryStatus
  deliveryId: string
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
      const { data, error: rpcError } = await supabase.rpc(
        'update_delivery_status_from_public_session',
        {
          p_delivery_id: deliveryId,
          p_next_status: nextStatus,
        },
      )

      if (rpcError) {
        setError('Não foi possível atualizar o status. Tente novamente.')
        return
      }

      if (!data || typeof (data as Record<string, unknown>).updated_at !== 'string') {
        console.error('[DriverActions] advance: unexpected RPC response shape', data)
        // Still advance the status optimistically with a fallback timestamp
        onStatusUpdate(nextStatus, new Date().toISOString())
        return
      }
      onStatusUpdate(nextStatus, (data as { updated_at: string }).updated_at)
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
          onProofAttached={onProofAttached}
        />
      )}

      {error && <p className="text-xs text-red-500 text-center">{error}</p>}
    </div>
  )
}
