import { isAxiosError } from "axios"
import { api } from "./authServices"
import type { Product } from "../types"

export interface ChatTurn {
  role: "user" | "assistant"
  content: string
}

// Small order card (only the logged-in customer's own orders)
export interface ChatOrder {
  orderNumber: string
  status: string
  total: number
  itemCount: number
  isPaid: boolean
  paymentMethodName: string
  createdAt: string
}

export interface ChatResponse {
  reply: string
  products: Product[]
  orders: ChatOrder[]
}

// POST /api/chat  ->  { reply, products, orders }
// The login token (if any) is added by the api interceptor, so logged-in customers can ask about their orders.
// The products come from SQL Server (same shape as GET /api/products).
export const sendChat = async (
  message: string,
  history: ChatTurn[]
): Promise<ChatResponse> => {
  try {
    const res = (await api.post(
      "/api/chat",
      { message, history },
      { timeout: 30000 } // the AI may search the catalogue before answering
    )) as unknown as { reply?: string; products?: Product[]; orders?: ChatOrder[] }

    if (!res?.reply) throw new Error("Empty reply")

    return {
      reply: res.reply,
      products: (res.products ?? []).map((p) => ({ ...p, _id: p._id ?? p.id ?? "" })),
      orders: res.orders ?? [],
    }
  } catch (error) {
    const status = isAxiosError(error) ? error.response?.status : undefined
    const serverMessage = isAxiosError(error) ? error.response?.data?.message : undefined

    let text = serverMessage || "The assistant is not available right now."
    if (status === 429) text = "You are sending messages too fast. Please wait a minute."
    else if (isAxiosError(error) && error.code === "ECONNABORTED")
      text = "The assistant took too long to answer. Please try again."

    throw new Error(text, { cause: error })
  }
}