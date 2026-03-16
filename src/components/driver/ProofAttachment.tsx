'use client'

import { useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

interface Props {
  deliveryId: string
  supabase: SupabaseClient
  portalSessionToken: string
  onProofAttached: (proof_file_id: string) => void
}

export default function ProofAttachment({ deliveryId, supabase, portalSessionToken, onProofAttached }: Props) {
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError(null)

    try {
      // Use a random ID as file identifier
      const fileId = crypto.randomUUID()
      const storagePath = `proofs/${deliveryId}/${fileId}`

      // Storage upload still uses the Supabase client
      const { error: uploadError } = await supabase.storage
        .from('delivery-proofs')
        .upload(storagePath, file, { contentType: file.type })

      if (uploadError) {
        setError('Erro ao enviar a foto. Tente novamente.')
        return
      }

      const res = await fetch(`/api/external/delivery/proof`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${portalSessionToken}`,
        },
        body: JSON.stringify({ proofFileId: fileId }),
      })

      if (!res.ok) {
        // v1: orphaned Storage file accepted on RPC failure. A future improvement
        // would call supabase.storage.from('delivery-proofs').remove([storagePath])
        // to clean up. For now, log the error and surface the user-facing message.
        console.error('[ProofAttachment] proof registration failed')
        setError('Erro ao registrar o comprovante. Tente novamente.')
        return
      }

      onProofAttached(fileId)
      setDone(true)
    } finally {
      setUploading(false)
    }
  }

  if (done) {
    return (
      <div className="flex items-center gap-2 text-sm text-green-600">
        <span>✓</span>
        <span>Comprovante enviado</span>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-sm text-gray-600 font-medium">Comprovante de entrega</p>

      {/* Primary: camera capture (opens rear camera on mobile) */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={uploading}
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />

      <div className="flex gap-2">
        <button
          onClick={() => cameraInputRef.current?.click()}
          disabled={uploading}
          className="flex-1 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 disabled:opacity-40 active:bg-gray-50"
        >
          {uploading ? 'Enviando...' : '📷 Tirar foto'}
        </button>

        {/* Fallback: file picker (gallery / files) */}
        <label className="flex-1 py-2.5 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 text-center cursor-pointer active:bg-gray-50">
          🖼️ Galeria
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </label>
      </div>

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
