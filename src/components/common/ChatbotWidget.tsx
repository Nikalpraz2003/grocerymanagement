import { useState } from 'react'
import { MessageCircle, SendHorizonal, X } from 'lucide-react'

type Message = {
  sender: 'user' | 'bot'
  text: string
}

const quickReplies: Record<string, string> = {
  hello: 'Hi! I can help with delivery, pricing, and product questions.',
  hi: 'Hello! Ask me about products, delivery, or refund support.',
  delivery: 'We deliver within 30 to 45 minutes in most service areas.',
  price: 'Our products are competitively priced, and we also offer daily offers and discounts.',
  offer: 'Check the deals section for fresh discounts and limited-time grocery offers.',
  refund: 'You can request a refund from your order details page or contact support for help.',
  payment: 'We support secure online payments through available checkout methods.',
  product: 'You can browse products from the home page or search by category and name.',
  order: 'You can track your order from the My Orders section in the app.',
}

const getBotReply = (input: string) => {
  const text = input.toLowerCase()

  for (const key in quickReplies) {
    if (text.includes(key)) {
      return quickReplies[key]
    }
  }

  return 'I can help with delivery, products, pricing, offers, and order support.'
}

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([
    { sender: 'bot', text: 'Hi! Ask me anything about groceries, offers, or delivery.' },
  ])

  const sendMessage = () => {
    const trimmed = input.trim()
    if (!trimmed) return

    const userMessage: Message = { sender: 'user', text: trimmed }
    const botMessage: Message = { sender: 'bot', text: getBotReply(trimmed) }

    setMessages((prev) => [...prev, userMessage, botMessage])
    setInput('')
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-4 w-[340px] overflow-hidden rounded-2xl border border-app-border bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-app-green px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-white/10">
                <MessageCircle className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Grocery Assistant</p>
                <p className="text-[10px] text-white/70">Online now</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 text-white/80 hover:bg-white/10 hover:text-white"
              aria-label="Close chatbot"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="flex h-[320px] flex-col gap-3 bg-[#f8f7f4] p-3">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1">
              {messages.map((message, index) => (
                <div
                  key={`${message.sender}-${index}`}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-5 ${
                      message.sender === 'user'
                        ? 'bg-app-orange text-white'
                        : 'bg-white text-app-text shadow-sm'
                    }`}
                  >
                    {message.text}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-app-border bg-white p-2">
              <input
                aria-label="Chat message"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    sendMessage()
                  }
                }}
                placeholder="Type a message..."
                className="flex-1 border-none bg-transparent px-2 py-1 text-sm text-app-text placeholder:text-app-text-light focus:outline-none"
              />
              <button
                type="button"
                onClick={sendMessage}
                className="flex size-9 items-center justify-center rounded-full bg-app-orange text-white hover:bg-app-orange-dark"
                aria-label="Send message"
              >
                <SendHorizonal className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="flex size-14 items-center justify-center rounded-full bg-app-orange text-white shadow-lg shadow-orange-500/30 transition-transform hover:scale-105 hover:bg-app-orange-dark"
          aria-label="Open chatbot"
        >
          <MessageCircle className="size-7" />
        </button>
      )}
    </div>
  )
}

export default ChatbotWidget
