'use client'

import { Theme } from '@radix-ui/themes'
import { ThemeProvider as NextThemesProvider } from 'next-themes'
import { useTheme } from '@/hooks/useTheme'

interface RadixThemeProviderProps {
  children: React.ReactNode
}

function ThemeWrapper({ children }: { children: React.ReactNode }) {
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

export function RadixThemeProvider({ children }: RadixThemeProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <ThemeWrapper>
        {children}
      </ThemeWrapper>
    </NextThemesProvider>
  )
}

