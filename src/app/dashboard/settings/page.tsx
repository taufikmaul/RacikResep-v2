'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@radix-ui/themes'
import { Palette, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

const ACCENT_COLORS = [
  { name: 'Blue', value: 'blue', color: '#3b82f6' },
  { name: 'Red', value: 'red', color: '#ef4444' },
  { name: 'Green', value: 'green', color: '#22c55e' },
  { name: 'Yellow', value: 'yellow', color: '#eab308' },
  { name: 'Purple', value: 'purple', color: '#a855f7' },
  { name: 'Pink', value: 'pink', color: '#ec4899' },
  { name: 'Indigo', value: 'indigo', color: '#6366f1' },
  { name: 'Cyan', value: 'cyan', color: '#06b6d4' },
  { name: 'Orange', value: 'orange', color: '#f97316' },
  { name: 'Amber', value: 'amber', color: '#f59e0b' },
  { name: 'Lime', value: 'lime', color: '#84cc16' },
  { name: 'Emerald', value: 'emerald', color: '#10b981' },
  { name: 'Teal', value: 'teal', color: '#14b8a6' },
  { name: 'Sky', value: 'sky', color: '#0ea5e9' },
  { name: 'Violet', value: 'violet', color: '#8b5cf6' },
  { name: 'Fuchsia', value: 'fuchsia', color: '#d946ef' },
  { name: 'Rose', value: 'rose', color: '#f43f5e' }
]

export default function SettingsPage() {
  const [selectedColor, setSelectedColor] = useState('blue')
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    fetchCurrentSettings()
  }, [])

  const fetchCurrentSettings = async () => {
    try {
      const response = await fetch('/api/settings/theme')
      if (response.ok) {
        const data = await response.json()
        setSelectedColor(data.accentColor || 'blue')
      }
    } catch (error) {
      console.error('Error fetching settings:', error)
    } finally {
      setInitialLoading(false)
    }
  }

  const handleColorChange = async (colorValue: string) => {
    setSelectedColor(colorValue)
    setLoading(true)

    try {
      const response = await fetch('/api/settings/theme', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accentColor: colorValue }),
      })

      if (response.ok) {
        toast.success('Tema berhasil diperbarui!')
        // Reload the page to apply the new theme
        window.location.reload()
      } else {
        throw new Error('Failed to update theme')
      }
    } catch (error) {
      console.error('Error updating theme:', error)
      toast.error('Gagal memperbarui tema')
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'var(--gray-11)' }} />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-background)' }}>
      <div className="max-w-4xl mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold" style={{ color: 'var(--gray-12)' }}>
            Pengaturan
          </h1>
          <p className="mt-2" style={{ color: 'var(--gray-11)' }}>
            Kelola preferensi dan tampilan aplikasi Anda
          </p>
        </div>

        <div className="space-y-6">
          {/* Theme Settings */}
          <Card className="p-6">
            <div className="flex items-center mb-4">
              <Palette className="h-5 w-5 mr-2" style={{ color: 'var(--accent-9)' }} />
              <h2 className="text-xl font-semibold" style={{ color: 'var(--gray-12)' }}>
                Tema Warna
              </h2>
            </div>
            <p className="mb-6" style={{ color: 'var(--gray-11)' }}>
              Pilih warna aksen yang akan diterapkan di seluruh aplikasi
            </p>

            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {ACCENT_COLORS.map((color) => (
                <button
                  key={color.value}
                  onClick={() => handleColorChange(color.value)}
                  disabled={loading}
                  className={`
                    relative p-3 rounded-xl transition-all duration-200 hover:scale-105
                    ${selectedColor === color.value 
                      ? 'ring-2 ring-offset-2 ring-offset-background' 
                      : 'hover:shadow-md'
                    }
                  `}
                  style={{
                    backgroundColor: color.color,
                    ...(selectedColor === color.value && {
                      '--tw-ring-color': color.color
                    } as React.CSSProperties)
                  }}
                  title={color.name}
                >
                  {selectedColor === color.value && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full shadow-sm" />
                    </div>
                  )}
                  <div className="h-8" />
                </button>
              ))}
            </div>

            {loading && (
              <div className="mt-4 flex items-center justify-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" style={{ color: 'var(--accent-9)' }} />
                <span style={{ color: 'var(--gray-11)' }}>Menyimpan perubahan...</span>
              </div>
            )}
          </Card>

          {/* Preview Section */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--gray-12)' }}>
              Pratinjau
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-4">
                <Button 
                  style={{ 
                    background: 'var(--accent-9)', 
                    color: 'white',
                    border: 'none'
                  }}
                >
                  Tombol Utama
                </Button>
                <Button variant="outline">
                  Tombol Sekunder
                </Button>
              </div>
              
              <div className="p-4 rounded-lg" style={{ background: 'var(--accent-2)', border: '1px solid var(--accent-6)' }}>
                <p style={{ color: 'var(--accent-11)' }}>
                  Ini adalah contoh komponen dengan warna aksen yang dipilih
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
