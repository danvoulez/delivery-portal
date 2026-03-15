import type { PortalMessage, Audience } from '@/types/portal'

interface Props {
  message: PortalMessage
  myAudience: Audience
}

export default function ChatMessage({ message, myAudience }: Props) {
  const isMine = message.sender_audience === myAudience

  return (
    <div className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed ${
          isMine
            ? 'bg-blue-500 text-white rounded-br-sm'
            : 'bg-gray-100 text-gray-800 rounded-bl-sm'
        }`}
      >
        {message.body}
      </div>
    </div>
  )
}
