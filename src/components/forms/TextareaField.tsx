"use client"

import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

interface TextareaFieldProps {
  label?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

export function TextareaField({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  rows = 3, 
  className 
}: TextareaFieldProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="text-sm font-medium text-foreground">
          {label}
        </label>
      )}
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn("w-full", className)}
      />
    </div>
  )
}
