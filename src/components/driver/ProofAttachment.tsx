'use client'

import { useRef, useState } from 'react'
import type { SupabaseClient } from '@supabase/supabase-js'

interface Props {
  deliveryId: string
  supabase: SupabaseClient
  onProofAttached: (proof_file_id: string) => void
}

export default function ProofAttachment({ deliveryId, supabase, onProofAttached }: Props) {
  const [uploading, setUploading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    setUploading(true)
    setError(null)

    // Use a random ID as file identifier — matches what attach_proof_to_delivery expects
    const fileId = crypto.randomUUID()
    const storagePath = `proofs/${deliveryId}/${fileId}`

    const { error: uploadError } = await supabase.storage
      .from('delivery-proofs')
      .upload(storagePath, file, { contentType: file.type })

    if (uploadError) {
      setError('Erro ao enviar a foto. Tente novamente.')
      setUploading(false)
      return
    }

    const { error: rpcError } = await supabase.rpc('attach_proof_to_delivery', {
      p_delivery_id: deliveryId,
      p_file_id: fileId,
    })

    if (rpcError) {
      setError('Erro ao registrar o comprovante. Tente novamente.')
      setUploading(false)
      return
    }

    onProofAttached(fileId)
    setDone(true)
    setUploading(false)
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
