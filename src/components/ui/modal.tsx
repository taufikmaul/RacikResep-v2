'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { Card, Theme } from '@radix-ui/themes'
import { X } from 'lucide-react'
import { Button } from './button'
import { useTheme } from '@/hooks/useTheme'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

function DynamicTheme({ children }: { children: React.ReactNode }) {
  const { accentColor, loading } = useTheme()
  
  if (loading) {
    return (
      <Theme 
        panelBackground="solid"
        scaling="100%"
        radius="medium"
        accentColor="blue"
        grayColor="slate"
      >
        {children}
      </Theme>
    )
  }

  return (
    <Theme 
      panelBackground="solid"
      scaling="100%"
      radius="medium"
      accentColor={accentColor as any}
      grayColor="slate"
    >
      {children}
    </Theme>
  )
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl'
  }

  return (
    <Dialog.Root open={isOpen} onOpenChange={onClose}>
      <Dialog.Portal>
        <DynamicTheme>
          <Dialog.Overlay style={{ background: "var(--color-overlay)" }} className="fixed inset-0 z-50 backdrop-blur-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <Dialog.Content style={{ background: "var(--color-panel-solid)" }} className={`fixed left-[50%] top-[50%] z-50 w-full ${sizeClasses[size]} max-h-[90vh] translate-x-[-50%] translate-y-[-50%] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]`}>
            <Card className="h-full overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-6" style={{ borderBottom: "1px solid var(--gray-6)" }}>
                <Dialog.Title className="text-xl font-semibold" style={{ color: "var(--gray-12)" }}>
                  {title}
                </Dialog.Title>
                <Dialog.Close asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                  </Button>
                </Dialog.Close>
              </div>
              
              {/* Content */}
              <div className="max-h-[calc(90vh-80px)] overflow-y-auto">
                {children}
              </div>
            </Card>
          </Dialog.Content>
        </DynamicTheme>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
