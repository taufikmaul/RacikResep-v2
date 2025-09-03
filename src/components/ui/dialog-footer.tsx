'use client'

import { ReactNode } from 'react'

interface DialogFooterProps {
  children: ReactNode
  className?: string
}

export function DialogFooter({ children, className = '' }: DialogFooterProps) {
  return (
    <div 
      style={{ 
        background: "var(--color-panel-solid)"
      }} 
      className={`border-t border-gray-200 pt-4 px-4 sm:px-6 flex-shrink-0 ${className}`}
    >
      <div className="flex gap-3 sm:gap-4 pb-4">
        {children}
      </div>
    </div>
  )
}
