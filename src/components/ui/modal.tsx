'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { Card, Theme } from '@radix-ui/themes'
import { X } from 'lucide-react'
import { Button } from './button'
import { DialogFooter } from './dialog-footer'
import { useRef, useEffect, useState } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  footer?: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export function Modal({ isOpen, onClose, title, children, footer, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-sm sm:max-w-md',
    md: 'max-w-sm sm:max-w-md md:max-w-lg',
    lg: 'max-w-sm sm:max-w-lg md:max-w-2xl',
    xl: 'max-w-sm sm:max-w-2xl md:max-w-4xl',
    '2xl': 'max-w-sm sm:max-w-4xl md:max-w-6xl'
  }

  const headerRef = useRef<HTMLDivElement>(null)
  const footerRef = useRef<HTMLDivElement>(null)
  const [contentHeight, setContentHeight] = useState<string>('calc(100vh - 120px)')
  const [fallbackHeight, setFallbackHeight] = useState<string>('calc(100vh - 120px)')

  useEffect(() => {
    if (isOpen) {
      const updateContentHeight = () => {
        const headerHeight = headerRef.current?.offsetHeight || 80
        const footerHeight = footer ? (footerRef.current?.offsetHeight || 80) : 0
        const viewportHeight = window.innerHeight
        const viewportWidth = window.innerWidth
        
        // Responsive height calculation
        let maxHeight: number
        if (viewportWidth < 640) { // Mobile
          maxHeight = viewportHeight - 80
        } else if (viewportWidth < 1024) { // Tablet
          maxHeight = Math.min(viewportHeight - 100, 600)
        } else { // Desktop
          maxHeight = Math.min(viewportHeight - 120, 800)
        }
        
        const newHeight = `calc(${maxHeight}px - ${headerHeight}px - ${footerHeight}px)`
        setContentHeight(newHeight)
        setFallbackHeight(newHeight)
      }

      // Update height after a short delay to ensure DOM is rendered
      const timer = setTimeout(updateContentHeight, 100)
      
      // Also update on window resize
      window.addEventListener('resize', updateContentHeight)
      
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', updateContentHeight)
      }
    }
  }, [isOpen, footer])



  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <Theme 
          panelBackground="solid"
          scaling="90%"
          radius="medium"
          grayColor="slate"
        >
          <Dialog.Overlay 
            style={{ background: "rgba(0, 0, 0, 0.6)" }} 
            className="fixed inset-0 z-50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-300 data-[state=open]:fade-in-300 duration-300" 
          />
          <Dialog.Content 
            style={{ 
              background: "var(--color-panel-solid)"
            }} 
            className={`fixed left-[50%] top-[50%] z-50 w-full ${sizeClasses[size]} max-h-[90vh] mx-4 translate-x-[-50%] translate-y-[-50%] duration-300 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-300 data-[state=open]:fade-in-300 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] shadow-2xl`}
          >
            <Card className="max-h-full overflow-hidden [&.rt-r-size-1]:!rt-r-size-0 flex flex-col">
              {/* Header */}
              <div 
                ref={headerRef}
                className="flex items-center justify-between p-3 sm:p-4 md:p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 flex-shrink-0"
              >
                <Dialog.Title className="text-lg sm:text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent truncate pr-2">
                  {title}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 transition-all duration-200 rounded-full flex-shrink-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </Dialog.Close>
              </div>
              
              {/* Content */}
              <div 
                className="overflow-y-auto bg-white min-h-0 flex-1 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                style={{
                  maxHeight: contentHeight,
                  scrollBehavior: 'smooth'
                }}
              >
                {children}
              </div>
              
              {/* Footer */}
              {footer && (
                <div ref={footerRef}>
                  <DialogFooter>
                    {footer}
                  </DialogFooter>
                </div>
              )}
            </Card>
          </Dialog.Content>
        </Theme>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
