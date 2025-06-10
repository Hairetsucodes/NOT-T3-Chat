import type { ReactNode } from "react"

export interface ModelCapability {
  icon: ReactNode
  label: string
}

export interface AIModel {
  id: string
  name: string
  subtitle?: string
  icon: ReactNode
  capabilities: ModelCapability[]
  isPro?: boolean
  isDisabled?: boolean
  isFavorite?: boolean
  isExperimental?: boolean
  requiresKey?: boolean
} 