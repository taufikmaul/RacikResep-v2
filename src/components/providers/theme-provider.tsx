'use client'

import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { Theme } from '@radix-ui/themes'
import { useEffect } from 'react'

interface RadixThemeProviderProps {
  children: React.ReactNode
}

function ThemeWrapper({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Clean up any existing accent color from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('business-accent-color')
    }
  }, [])

  return (
    <Theme 
      grayColor="gray" 
      panelBackground="solid" 
      scaling="100%"
    >
      {children}
    </Theme>
  )
}

export function RadixThemeProvider({ children }: RadixThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeWrapper>{children}</ThemeWrapper>
    </NextThemesProvider>
  )
}

