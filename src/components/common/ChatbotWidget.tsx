import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, Package, Plus, SendHorizonal, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { sendChat, type ChatOrder, type ChatTurn } from '../../services/chatApi'
import { useOptionalCart } from '../../context/CartContext'
import type { Product } from '../../types'

type Message = {
  sender: 'user' | 'bot'
  text: string
  products?: Product[]
  orders?: ChatOrder[]
  isError?: boolean
}

const WELCOME = 'Namaste! I can find products, check prices and stock, track your orders, or answer delivery and payment questions.'

const SUGGESTIONS = [
  'Fresh fruits under Rs. 200',
  'Any deals today?',
  'Where is my order?',
  'What are the delivery charges?',
]

const formatRs = (value: number) => `Rs. ${Number(value).toLocaleString('en-IN')}`

const ChatProductCard = ({ product }: { product: Product }) => {
  const navigate = useNavigate()
  const cart = useOptionalCart()
  const outOfStock = product.stock <= 0
  const id = product.id ?? product._id

  return (
    <div className="flex items-center gap-2 rounded-xl border border-app-border bg-white p-2">
      <button
        type="button"
        onClick={() => navigate(`/product/${id}`)}
        className="flex min-w-0 flex-1 items-center gap-2 text-left"
      >
        <img
          src={product.image}
          alt={product.name}
          className="size-12 shrink-0 rounded-lg bg-app-cream object-cover"
          loading="lazy"
        />
        <div className="min-w-0">
          <p className="truncate text-xs font-semibold text-app-text">{product.name}</p>
          <p className="text-[10px] text-app-text-light">{product.unit}</p>
          <div className="flex items-baseline gap-1">
            <span className="text-xs font-bold text-app-green">{formatRs(product.price)}</span>
            {product.originalPrice > product.price && (
              <span className="text-[10px] text-app-text-light line-through">
                {formatRs(product.originalPrice)}
              </span>
            )}
          </div>
          <p
            className={`text-[10px] font-medium ${
              outOfStock ? 'text-app-error' : product.stock <= 10 ? 'text-app-warning' : 'text-app-success'
            }`}
          >
            {outOfStock ? 'Out of stock' : product.stock <= 10 ? `Only ${product.stock} left` : 'In stock'}
          </p>
        </div>
      </button>

      {cart && (
        <button
          type="button"
          disabled={outOfStock}
          onClick={() => {
            cart.addToCart(product)
            toast.success(`${product.name} added to cart`)
          }}
          className="flex size-8 shrink-0 items-center justify-center rounded-full bg-app-orange text-white hover:bg-app-orange-dark disabled:cursor-not-allowed disabled:bg-gray-300"
          aria-label={`Add ${product.name} to cart`}
        >
          <Plus className="size-4" />
        </button>
      )}
    </div>
  )
}

const ORDER_STATUS_STYLE: Record<string, string> = {
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-red-100 text-red-600',
  'Out for Delivery': 'bg-blue-100 text-blue-700',
  'Awaiting Payment': 'bg-amber-100 text-amber-700',
}

const ChatOrderCard = ({ order }: { order: ChatOrder }) => {
  const navigate = useNavigate()
  const placed = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })

  return (
    <button
      type="button"
      onClick={() => navigate(`/orders/${order.orderNumber}`)}
      className="flex w-full items-center gap-2 rounded-xl border border-app-border bg-white p-2 text-left hover:border-app-orange"
    >
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-app-cream text-app-green">
        <Package className="size-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-semibold text-app-text">{order.orderNumber}</p>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              ORDER_STATUS_STYLE[order.status] ?? 'bg-orange-100 text-app-orange-dark'
            }`}
          >
            {order.status}
          </span>
        </div>
        <p className="text-[10px] text-app-text-light">
          {placed} · {order.itemCount} item{order.itemCount === 1 ? '' : 's'} · {order.isPaid ? 'Paid' : order.paymentMethodName}
        </p>
        <p className="text-xs font-bold text-app-green">{formatRs(order.total)}</p>
        <p className="text-[10px] font-medium text-app-orange">Track order →</p>
      </div>
    </button>
  )
}

const ChatbotWidget = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [messages, setMessages] = useState<Message[]>([{ sender: 'bot', text: WELCOME }])
  const bottomRef = useRef<HTMLDivElement>(null)
  const lastMessageRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // New bot answer -> show it from its first line (product cards can be long);
  // otherwise keep the newest message / typing dots in view.
  useEffect(() => {
    const last = messages[messages.length - 1]
    if (last?.sender === 'bot' && messages.length > 1 && !isTyping) {
      lastMessageRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    } else {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, isTyping, isOpen])

  useEffect(() => {
    if (isOpen) inputRef.current?.focus()
  }, [isOpen])

  const sendMessage = async (text?: string) => {
    const trimmed = (text ?? input).trim()
    if (!trimmed || isTyping) return

    // History for the AI: earlier real messages only (no welcome text, no error bubbles)
    const history: ChatTurn[] = messages
      .slice(1)
      .filter((m) => !m.isError)
      .map((m) => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text }))

    setMessages((prev) => [...prev, { sender: 'user', text: trimmed }])
    setInput('')
    setIsTyping(true)

    try {
      const res = await sendChat(trimmed, history)
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: res.reply, products: res.products, orders: res.orders },
      ])
    } catch (error) {
      const text = error instanceof Error ? error.message : 'The assistant is not available right now.'
      setMessages((prev) => [...prev, { sender: 'bot', text, isError: true }])
    } finally {
      setIsTyping(false)
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {isOpen && (
        <div className="mb-4 flex w-[calc(100vw-2.5rem)] max-w-[370px] flex-col overflow-hidden rounded-2xl border border-app-border bg-white shadow-2xl">
          <div className="flex items-center justify-between bg-app-green px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-white/10">
                <MessageCircle className="size-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Pasalmandu Assistant</p>
                <p className="text-[10px] text-white/70">{isTyping ? 'Typing…' : 'Online now'}</p>
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

          <div className="flex h-[min(440px,65vh)] flex-col gap-3 bg-[#f8f7f4] p-3">
            <div className="flex-1 space-y-3 overflow-y-auto pr-1" aria-live="polite">
              {messages.map((message, index) => (
                <div
                  key={`${message.sender}-${index}`}
                  ref={index === messages.length - 1 ? lastMessageRef : undefined}
                  className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm leading-5 ${
                      message.sender === 'user'
                        ? 'bg-app-orange text-white'
                        : message.isError
                          ? 'border border-red-200 bg-red-50 text-app-error'
                          : 'bg-white text-app-text shadow-sm'
                    }`}
                  >
                    {message.text}
                  </div>

                  {message.orders && message.orders.length > 0 && (
                    <div className="mt-2 w-[92%] space-y-2">
                      {message.orders.map((order) => (
                        <ChatOrderCard key={order.orderNumber} order={order} />
                      ))}
                    </div>
                  )}

                  {message.products && message.products.length > 0 && (
                    <div className="mt-2 w-[92%] space-y-2">
                      {message.products.map((product) => (
                        <ChatProductCard key={product._id} product={product} />
                      ))}
                    </div>
                  )}
                </div>
              ))}

              {messages.length === 1 && !isTyping && (
                <div className="flex flex-wrap gap-2 pt-1">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => sendMessage(s)}
                      className="rounded-full border border-app-border bg-white px-3 py-1 text-xs text-app-text hover:border-app-orange hover:text-app-orange"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="flex gap-1 rounded-2xl bg-white px-3 py-3 shadow-sm" aria-label="Assistant is typing">
                    <span className="size-1.5 animate-bounce rounded-full bg-app-text-light [animation-delay:-0.3s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-app-text-light [animation-delay:-0.15s]" />
                    <span className="size-1.5 animate-bounce rounded-full bg-app-text-light" />
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-app-border bg-white p-2">
              <input
                ref={inputRef}
                aria-label="Chat message"
                value={input}
                maxLength={500}
                onChange={(event) => setInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
                    sendMessage()
                  }
                }}
                placeholder="Ask about products, orders, delivery…"
                className="flex-1 border-none bg-transparent px-2 py-1 text-sm text-app-text placeholder:text-app-text-light focus:outline-none"
              />
              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={isTyping || !input.trim()}
                className="flex size-9 items-center justify-center rounded-full bg-app-orange text-white hover:bg-app-orange-dark disabled:cursor-not-allowed disabled:opacity-50"
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