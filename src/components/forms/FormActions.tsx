"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface FormActionsProps {
  onCancel?: () => void
  submitLabel?: string
  submitText?: string // Alias for submitLabel for backward compatibility
  cancelLabel?: string
  loading?: boolean
  className?: string
}

export function FormActions({ 
  onCancel, 
  submitLabel, 
  submitText,
  cancelLabel = "Batal",
  loading = false,
  className 
}: FormActionsProps) {
  const finalSubmitLabel = submitLabel || submitText || "Simpan"
  
  return (
    <div className={cn("flex flex-col sm:flex-row gap-3 justify-end", className)}>
      {onCancel && (
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={loading}
          className="hover:bg-accent hover:text-accent-foreground w-full sm:w-auto order-2 sm:order-1"
        >
          {cancelLabel}
        </Button>
      )}
      <Button
        type="submit"
        disabled={loading}
        className="bg-accent text-accent-foreground hover:bg-accent/90 w-full sm:w-auto order-1 sm:order-2"
      >
        {loading ? "Menyimpan..." : finalSubmitLabel}
      </Button>
    </div>
  )
}

export default FormActions
