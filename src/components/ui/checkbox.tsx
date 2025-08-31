'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const handleClick = () => {
      if (onCheckedChange) {
        onCheckedChange(!checked)
      }
    }

    return (
      <div
        className={cn(
          'relative flex h-4 w-4 items-center justify-center rounded border border-gray-300 transition-colors cursor-pointer',
          checked && 'bg-blue-600 border-blue-600',
          !checked && 'hover:border-gray-400',
          className
        )}
        onClick={handleClick}
      >
        {checked && (
          <Check className="h-3 w-3 text-white" />
        )}
        <input
          type="checkbox"
          className="sr-only"
          checked={checked}
          onChange={() => {}} // Handled by onClick
          ref={ref}
          {...props}
        />
      </div>
    )
  }
)

Checkbox.displayName = 'Checkbox'

export { Checkbox }
