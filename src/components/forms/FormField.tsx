"use client"

import React from "react"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface FormFieldProps {
  label: string
  htmlFor?: string
  required?: boolean
  description?: string
  helper?: string
  children: React.ReactNode
  className?: string
}

export function FormField({ 
  label, 
  htmlFor, 
  required = false, 
  description,
  helper,
  children, 
  className 
}: FormFieldProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label 
          htmlFor={htmlFor} 
          className="text-sm font-medium text-foreground"
        >
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </Label>
        {helper && (
          <span className="text-xs text-muted-foreground">{helper}</span>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {children}
    </div>
  )
}

export default FormField
