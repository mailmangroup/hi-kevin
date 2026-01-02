"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export type ToastType = "success" | "error" | "warning" | "info"

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
}

interface ToastContextType {
  toasts: Toast[]
  toast: (toast: Omit<Toast, "id">) => void
  dismiss: (id: string) => void
}

const ToastContext = React.createContext<ToastContextType | null>(null)

export function useToast() {
  const context = React.useContext(ToastContext)
  if (!context) {
    throw new Error("useToast must be used within ToastProvider")
  }
  return context
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([])

  const dismiss = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = {
      id,
      duration: toast.type === "error" ? 5000 : 3000,
      ...toast,
    }

    setToasts((prev) => [...prev, newToast])

    // Auto dismiss
    if (newToast.duration) {
      setTimeout(() => {
        dismiss(id)
      }, newToast.duration)
    }
  }, [dismiss])

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed right-4 top-4 z-50 flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

interface ToastItemProps {
  toast: Toast
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps) {
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    // Trigger animation on mount
    requestAnimationFrame(() => {
      setIsVisible(true)
    })
  }, [])

  const handleDismiss = () => {
    setIsVisible(false)
    setTimeout(() => {
      onDismiss(toast.id)
    }, 200) // Wait for animation
  }

  const typeStyles = {
    success: "bg-success border-success-dark text-white",
    error: "bg-error border-error-dark text-white",
    warning: "bg-warning border-warning-dark text-white",
    info: "bg-info border-info-dark text-white",
  }

  const icon = {
    success: "✓",
    error: "✕",
    warning: "⚠",
    info: "ℹ",
  }

  return (
    <div
      className={cn(
        "pointer-events-auto rounded-lg border-l-4 p-4 shadow-lg transition-all duration-200 ease-out",
        "bg-white border-border",
        isVisible
          ? "translate-x-0 opacity-100"
          : "translate-x-full opacity-0"
      )}
      role="alert"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "flex h-6 w-6 items-center justify-center rounded-full text-sm font-bold",
          typeStyles[toast.type]
        )}>
          {icon[toast.type]}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground">
            {toast.title}
          </p>
          {toast.description && (
            <p className="mt-1 text-sm text-muted-foreground">
              {toast.description}
            </p>
          )}
        </div>
        <button
          onClick={handleDismiss}
          className="flex h-5 w-5 items-center justify-center rounded hover:bg-gray-100 transition-colors"
          aria-label="Close"
        >
          <X className="h-4 w-4 text-muted-foreground" />
        </button>
      </div>
    </div>
  )
}

// Helper functions for common toast types
export const toastHelpers = {
  success: (title: string, description?: string) => ({
    type: "success" as const,
    title,
    description,
  }),
  error: (title: string, description?: string) => ({
    type: "error" as const,
    title,
    description,
  }),
  warning: (title: string, description?: string) => ({
    type: "warning" as const,
    title,
    description,
  }),
  info: (title: string, description?: string) => ({
    type: "info" as const,
    title,
    description,
  }),
}
