'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface ThemeSettings {
  accentColor: string
  theme: string
}

export function useTheme() {
  const { data: session } = useSession()
  const [themeSettings, setThemeSettings] = useState<ThemeSettings>({
    accentColor: 'blue',
    theme: 'light'
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchThemeSettings()
    } else {
      setLoading(false)
    }
  }, [session])

  const fetchThemeSettings = async () => {
    try {
      const response = await fetch('/api/settings/theme')
      if (response.ok) {
        const data = await response.json()
        setThemeSettings({
          accentColor: data.accentColor || 'blue',
          theme: data.theme || 'light'
        })
      }
    } catch (error) {
      console.error('Error fetching theme settings:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    accentColor: themeSettings.accentColor,
    theme: themeSettings.theme,
    loading,
    refetch: fetchThemeSettings
  }
}
