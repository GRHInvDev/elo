"use client"

import { createContext, useContext, useReducer, type ReactNode } from "react"
import type { Product } from "@prisma/client"
import type { CartItem, CartContextType } from "@/types/cart"
import { toast } from "sonner"

interface CartState {
  items: CartItem[]
  enterprise: Product["enterprise"] | null
}

type CartAction =
  | { type: "ADD_ITEM"; product: Product; quantity: number }
  | { type: "REMOVE_ITEM"; productId: string }
  | { type: "UPDATE_QUANTITY"; productId: string; quantity: number }
  | { type: "CLEAR_CART" }

const initialState: CartState = {
  items: [],
  enterprise: null
}

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const { product, quantity } = action

      // Se carrinho estiver vazio ou for da mesma empresa, permite adicionar
      if (state.enterprise === null || state.enterprise === product.enterprise) {
        const existingItem = state.items.find(item => item.product.id === product.id)

        if (existingItem) {
          // Se já existe, incrementa quantidade
          return {
            ...state,
            enterprise: product.enterprise,
            items: state.items.map(item =>
              item.product.id === product.id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            )
          }
        } else {
          // Se não existe, adiciona novo item
          return {
            ...state,
            enterprise: product.enterprise,
            items: [...state.items, { product, quantity }]
          }
        }
      } else {
        // Empresa diferente - mostra erro
        toast.error(`Você só pode adicionar produtos da empresa ${state.enterprise} ao carrinho.`)
        return state
      }
    }

    case "REMOVE_ITEM":
      const newItems = state.items.filter(item => item.product.id !== action.productId)
      return {
        ...state,
        items: newItems,
        enterprise: newItems.length === 0 ? null : state.enterprise
      }

    case "UPDATE_QUANTITY":
      if (action.quantity <= 0) {
        return cartReducer(state, { type: "REMOVE_ITEM", productId: action.productId })
      }

      return {
        ...state,
        items: state.items.map(item =>
          item.product.id === action.productId
            ? { ...item, quantity: Math.min(action.quantity, item.product.stock) }
            : item
        )
      }

    case "CLEAR_CART":
      return initialState

    default:
      return state
  }
}

const CartContext = createContext<CartContextType | null>(null)

interface CartProviderProps {
  children: ReactNode
}

export function CartProvider({ children }: CartProviderProps) {
  const [state, dispatch] = useReducer(cartReducer, initialState)

  const addItem = (product: Product, quantity?: number) => {
    dispatch({ type: "ADD_ITEM", product, quantity: quantity ?? 1 })
    toast.success(`"${product.name}" adicionado ao carrinho!`)
  }

  const removeItem = (productId: string) => {
    dispatch({ type: "REMOVE_ITEM", productId })
  }

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: "UPDATE_QUANTITY", productId, quantity })
  }

  const clearCart = () => {
    dispatch({ type: "CLEAR_CART" })
  }

  const getTotalItems = () => {
    return state.items.reduce((total, item) => total + item.quantity, 0)
  }

  const getTotalPrice = () => {
    return state.items.reduce((total, item) => total + (item.product.price * item.quantity), 0)
  }

  const isEmpty = () => {
    return state.items.length === 0
  }

  const contextValue: CartContextType = {
    items: state.items,
    enterprise: state.enterprise,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isEmpty
  }

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart(): CartContextType {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider")
  }
  return context
}
