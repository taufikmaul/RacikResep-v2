'use client'

import { SessionProvider } from 'next-auth/react'
import { RadixThemeProvider } from '@/components/providers/theme-provider'
import { ToastProvider } from '@/components/ui/toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
    <RadixThemeProvider>
      
        {children}
        <ToastProvider />
      
    </RadixThemeProvider>
    </SessionProvider>
  )
}
