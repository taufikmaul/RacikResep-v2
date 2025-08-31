'use client'

import { SessionProvider } from 'next-auth/react'
import { RadixThemeProvider } from '@/components/providers/theme-provider'
import { ThemeProvider } from '@/contexts/theme-context'
import { ToastProvider } from '@/components/ui/toast'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <RadixThemeProvider>
        <ThemeProvider>
          {children}
          <ToastProvider />
        </ThemeProvider>
      </RadixThemeProvider>
    </SessionProvider>
  )
}
