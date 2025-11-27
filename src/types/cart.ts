import type { Product } from "@prisma/client"

export interface CartItem {
  product: Product
  quantity: number
}

export interface CartContextType {
  items: CartItem[]
  enterprise: Product["enterprise"] | null
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  getTotalItems: () => number
  getTotalPrice: () => number
  isEmpty: () => boolean
}
