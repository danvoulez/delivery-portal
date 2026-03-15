'use client'

import { useEffect, useRef, useState } from 'react'
import type { DeliveryMessageView, Audience } from '@/types/portal'
import ChatMessage from './ChatMessage'

interface Props {
  messages: DeliveryMessageView[]
  audience: Audience
  deliveryId: string
  portalSessionToken: string
  onNewMessage: (msg: DeliveryMessageView) => void
  isTerminal: boolean
}

export default function ChatPanel({
  messages,
  audience,
  deliveryId: _deliveryId,
  portalSessionToken,
  onNewMessage,
  isTerminal,
}: Props) {
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length])

  const send = async () => {
    const trimmed = body.trim()
    if (!trimmed || sending) return
    setSending(true)
    try {
      const backendUrl = process.env.NEXT_PUBLIC_DELIVERY_BACKEND_URL
      const res = await fetch(`${backendUrl}/api/external/delivery/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${portalSessionToken}`,
        },
        body: JSON.stringify({ body: trimmed }),
      })
      if (!res.ok) {
        console.error('Failed to send message')
        return
      }
      const data = await res.json() as DeliveryMessageView
      onNewMessage(data)
      setBody('')
    } finally {
      setSending(false)
    }
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  return (
    <div data-testid="chat-panel" className="bg-white rounded-xl border flex flex-col h-72">
      <div className="px-4 py-2.5 border-b flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Mensagens</span>
        {messages.length > 0 && (
          <span className="text-xs text-gray-400">{messages.length}</span>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.length === 0 && (
          <p className="text-xs text-gray-400 text-center pt-4">
            Nenhuma mensagem ainda
          </p>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} myAudience={audience} />
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="border-t p-3 flex gap-2">
        <input
          data-testid="chat-input"
          aria-label="Mensagem"
          className="flex-1 text-sm border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300 bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
          placeholder={isTerminal ? 'Entrega finalizada' : 'Escreva uma mensagem...'}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={handleKey}
          disabled={sending || isTerminal}
        />
        <button
          data-testid="chat-send-button"
          aria-label="Enviar mensagem"
          aria-busy={sending}
          onClick={send}
          disabled={!body.trim() || sending || isTerminal}
          className="px-4 py-2 bg-blue-500 text-white text-sm rounded-lg font-medium disabled:opacity-40 transition-opacity"
        >
          {sending ? '...' : 'Enviar'}
        </button>
      </div>
    </div>
  )
}
