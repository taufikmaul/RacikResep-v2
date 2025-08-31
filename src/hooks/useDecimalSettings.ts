import { useState, useEffect } from 'react'
import { DecimalSettings } from '@/lib/utils'

export function useDecimalSettings() {
  const [settings, setSettings] = useState<DecimalSettings | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/settings/decimal')
        if (response.ok) {
          const data = await response.json()
          setSettings(data)
        } else {
          setError('Failed to fetch decimal settings')
        }
      } catch (err) {
        setError('Error fetching decimal settings')
        console.error('Error fetching decimal settings:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchSettings()
  }, [])

  const updateSettings = async (newSettings: Partial<DecimalSettings>) => {
    try {
      const response = await fetch('/api/settings/decimal', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      })

      if (response.ok) {
        const updatedSettings = await response.json()
        setSettings(updatedSettings)
        return { success: true, data: updatedSettings }
      } else {
        const errorData = await response.text()
        return { success: false, error: errorData }
      }
    } catch (err) {
      console.error('Error updating decimal settings:', err)
      return { success: false, error: 'Failed to update settings' }
    }
  }

  return {
    settings,
    loading,
    error,
    updateSettings,
  }
}
