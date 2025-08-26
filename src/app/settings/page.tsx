'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Edit, Save, Loader2, Building2, Palette, Globe, DollarSign, User as UserIcon, Lock, Image as ImageIcon } from 'lucide-react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'

interface BusinessProfile {
  id: string
  name: string
  address?: string
  phone?: string
  email?: string
  logo?: string
  currency: string
  language: string
  theme: string
}

interface Category {
  id: string
  name: string
  type: string
  color: string
}

interface Unit {
  id: string
  name: string
  symbol: string
  type: string
}

interface SalesChannel {
  id: string
  name: string
  commission: number
}

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
  const { data: session, update } = useSession()
  const [business, setBusiness] = useState<BusinessProfile | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedColor, setSelectedColor] = useState('blue')
  const [initialLoading, setInitialLoading] = useState(true)
  // account settings
  const [accountSaving, setAccountSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [accountForm, setAccountForm] = useState({ name: '', email: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  
  // Form states
  const [businessForm, setBusinessForm] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    currency: 'IDR',
    language: 'id',
    theme: 'light'
  })
  
  const [newCategory, setNewCategory] = useState({
    name: '',
    type: 'ingredient',
    color: '#6B7280'
  })
  
  const [newUnit, setNewUnit] = useState({
    name: '',
    symbol: '',
    type: 'purchase'
  })
  
  const [newChannel, setNewChannel] = useState({
    name: '',
    commission: 0
  })

  useEffect(() => {
    if (session) {
      fetchData()
      setAccountForm({ name: session.user?.name || '', email: session.user?.email || '' })
    }
  }, [session])

  const fetchData = async () => {
    try {
      const [businessRes, categoriesRes, unitsRes, channelsRes, themeRes] = await Promise.all([
        fetch('/api/business/profile'),
        fetch('/api/categories'),
        fetch('/api/units'),
        fetch('/api/sales-channels'),
        fetch('/api/settings/theme')
      ])

      if (businessRes.ok) {
        const businessData = await businessRes.json()
        setBusiness(businessData)
        setBusinessForm({
          name: businessData.name || '',
          address: businessData.address || '',
          phone: businessData.phone || '',
          email: businessData.email || '',
          currency: businessData.currency || 'IDR',
          language: businessData.language || 'id',
          theme: businessData.theme || 'light'
        })
      }

      if (themeRes.ok) {
        const dataTheme = await themeRes.json()
        setSelectedColor(dataTheme.accentColor || 'blue')
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json()
        setCategories(categoriesData)
      }

      if (unitsRes.ok) {
        const unitsData = await unitsRes.json()
        setUnits(unitsData)
      }

      if (channelsRes.ok) {
        const channelsData = await channelsRes.json()
        setSalesChannels(channelsData)
      }

      
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Upload business logo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/business/logo', { method: 'POST', body: form })
      if (!res.ok) throw new Error('Gagal mengunggah logo')
      const data = await res.json()
      setBusiness((prev) => (prev ? { ...prev, logo: data.logo } : prev))
      toast.success('Logo berhasil diperbarui')
    } catch (error: any) {
      toast.error(error?.message || 'Gagal mengunggah logo')
    }
  }

  // Update account profile (name/email)
  const handleAccountUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setAccountSaving(true)
    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountForm),
      })
      if (!res.ok) throw new Error('Gagal menyimpan profil')
      const data = await res.json()
      await update({ name: data.name, email: data.email })
      toast.success('Profil diperbarui')
    } catch (error: any) {
      toast.error(error?.message || 'Gagal menyimpan profil')
    } finally {
      setAccountSaving(false)
    }
  }

  // Change password
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }
    setPasswordSaving(true)
    try {
      const res = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        throw new Error(d?.error || 'Gagal mengganti password')
      }
      toast.success('Password berhasil diubah')
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
    } catch (error: any) {
      toast.error(error?.message || 'Gagal mengganti password')
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleBusinessUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      const response = await fetch('/api/business/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(businessForm),
      })

      if (response.ok) {
        const updatedProfile = await response.json()
        setBusiness(updatedProfile)
        toast.success('Profil bisnis berhasil diperbarui')
      } else {
        toast.error('Gagal memperbarui profil bisnis')
      }
    } catch (error) {
      console.error('Error updating business profile:', error)
      toast.error('Terjadi kesalahan')
    } finally {
      setSaving(false)
    }
  }

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      })

      if (response.ok) {
        const category = await response.json()
        setCategories([...categories, category])
        setNewCategory({ name: '', type: 'ingredient', color: '#6B7280' })
        toast.success('Kategori berhasil ditambahkan')
      } else {
        toast.error('Gagal menambahkan kategori')
      }
    } catch (error) {
      console.error('Error adding category:', error)
      toast.error('Gagal menambahkan kategori')
    }
  }

  const handleAddUnit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/units', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUnit),
      })

      if (response.ok) {
        const unit = await response.json()
        setUnits([...units, unit])
        setNewUnit({ name: '', symbol: '', type: 'weight' })
        toast.success('Satuan berhasil ditambahkan')
      } else {
        toast.error('Gagal menambahkan satuan')
      }
    } catch (error) {
      console.error('Error adding unit:', error)
      toast.error('Gagal menambahkan satuan')
    }
  }

  const handleAddChannel = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const response = await fetch('/api/sales-channels', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newChannel)
      })

      if (response.ok) {
        const channel = await response.json()
        setSalesChannels(prev => [...prev, channel])
        setNewChannel({ name: '', commission: 0 })
        toast.success('Channel berhasil ditambahkan')
      } else {
        toast.error('Gagal menambahkan channel')
      }
    } catch (error) {
      console.error('Error adding channel:', error)
      toast.error('Gagal menambahkan channel')
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus kategori ini?')) return

    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setCategories(categories.filter(cat => cat.id !== id))
        toast.success('Kategori berhasil dihapus')
      } else {
        toast.error('Gagal menghapus kategori')
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Gagal menghapus kategori')
    }
  }

  const handleDeleteUnit = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus satuan ini?')) return

    try {
      const response = await fetch(`/api/units/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setUnits(units.filter(unit => unit.id !== id))
        toast.success('Satuan berhasil dihapus')
      } else {
        toast.error('Gagal menghapus satuan')
      }
    } catch (error) {
      console.error('Error deleting unit:', error)
      toast.error('Gagal menghapus satuan')
    }
  }

  const handleDeleteChannel = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus channel ini?')) return

    try {
      const response = await fetch(`/api/sales-channels/${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setSalesChannels(prev => prev.filter(ch => ch.id !== id))
      }
    } catch (error) {
      console.error('Error deleting channel:', error)
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pengaturan</h1>
          <p className="text-gray-600">Kelola profil bisnis dan preferensi aplikasi</p>
        </div>

        {/* Account Settings */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserIcon className="h-5 w-5" />
                Profil Akun
              </CardTitle>
              <CardDescription>Perbarui nama dan email Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAccountUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama</label>
                  <Input value={accountForm.name} onChange={(e) => setAccountForm((p) => ({ ...p, name: e.target.value }))} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <Input type="email" value={accountForm.email} onChange={(e) => setAccountForm((p) => ({ ...p, email: e.target.value }))} required />
                </div>
                <Button type="submit" disabled={accountSaving} className="w-full sm:w-auto">
                  {accountSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>) : 'Simpan'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Ganti Password
              </CardTitle>
              <CardDescription>Atur password baru untuk akun Anda</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini</label>
                  <Input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Password Baru</label>
                    <Input type="password" value={passwordForm.newPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Konfirmasi Password</label>
                    <Input type="password" value={passwordForm.confirmPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))} required />
                  </div>
                </div>
                <Button type="submit" disabled={passwordSaving} className="w-full sm:w-auto">
                  {passwordSaving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>) : 'Ubah Password'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Business Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Profil Bisnis
            </CardTitle>
            <CardDescription>
              Informasi dasar tentang bisnis Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleBusinessUpdate} className="space-y-4">
              {/* Logo uploader */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                <div className="h-16 w-16 rounded-md flex items-center justify-center overflow-hidden" style={{ background: 'var(--gray-3)', border: '1px solid var(--gray-6)' }}>
                  {business?.logo ? (
                    <img src={business.logo} alt="Logo" className="h-full w-full object-cover" />
                  ) : (
                    <ImageIcon className="h-6 w-6" style={{ color: 'var(--gray-10)' }} />
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Logo Perusahaan</label>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} />
                  <p className="text-xs mt-1 text-gray-500">PNG/JPG, maks 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Bisnis *
                  </label>
                  <Input
                    value={businessForm.name}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, name: e.target.value }))}
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <Input
                    type="email"
                    value={businessForm.email}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, email: e.target.value }))}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Alamat
                </label>
                <textarea
                  value={businessForm.address}
                  onChange={(e) => setBusinessForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Telepon
                  </label>
                  <Input
                    value={businessForm.phone}
                    onChange={(e) => setBusinessForm(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mata Uang
                  </label>
                  <Select
                    value={businessForm.currency}
                    onValueChange={(value) => setBusinessForm(prev => ({ ...prev, currency: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Mata Uang" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="IDR">IDR - Rupiah</SelectItem>
                      <SelectItem value="USD">USD - Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Bahasa
                  </label>
                  <Select
                    value={businessForm.language}
                    onValueChange={(value) => setBusinessForm(prev => ({ ...prev, language: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Bahasa" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="id">Indonesia</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button type="submit" disabled={saving} className="w-full sm:w-auto">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  'Simpan Perubahan'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Theme Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Manajemen Tema
            </CardTitle>
            <CardDescription>
              Kelola tema untuk aplikasi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
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
          </CardContent>
        </Card>

        {/* Categories Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Manajemen Kategori
            </CardTitle>
            <CardDescription>
              Kelola kategori untuk bahan baku dan resep
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddCategory} className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  placeholder="Nama kategori"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Select
                  value={newCategory.type}
                  onValueChange={(value) => setNewCategory(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ingredient">Bahan Baku</SelectItem>
                    <SelectItem value="recipe">Resep</SelectItem>
                  </SelectContent>
                </Select>
                <input
                  type="color"
                  value={newCategory.color}
                  onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                  className="w-full h-10 border border-gray-300 rounded-md"
                />
                <Button type="submit" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah
                </Button>
              </div>
            </form>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {categories.map(category => (
                <div key={category.id} className="flex items-center justify-between p-4 sm:p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: category.color }}
                    ></div>
                    <span className="font-medium">{category.name}</span>
                    <span className="text-sm text-gray-500 capitalize">{category.type}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteCategory(category.id)}
                    className="text-red-600 hover:text-red-700 px-4 py-2 sm:px-3 sm:py-1.5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Units Management */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Manajemen Satuan
            </CardTitle>
            <CardDescription>
              Kelola satuan pembelian dan penggunaan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddUnit} className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <Input
                  placeholder="Nama satuan"
                  value={newUnit.name}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  placeholder="Simbol"
                  value={newUnit.symbol}
                  onChange={(e) => setNewUnit(prev => ({ ...prev, symbol: e.target.value }))}
                  required
                />
                <Select
                  value={newUnit.type}
                  onValueChange={(value) => setNewUnit(prev => ({ ...prev, type: value }))}
                >
                  <SelectTrigger className="w-full sm:w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Pembelian</SelectItem>
                    <SelectItem value="usage">Penggunaan</SelectItem>
                  </SelectContent>
                </Select>
                <Button type="submit" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah
                </Button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Satuan Pembelian</h4>
                <div className="space-y-3 sm:space-y-2">
                  {units.filter(unit => unit.type === 'purchase').map(unit => (
                    <div key={unit.id} className="flex items-center justify-between p-4 sm:p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{unit.name}</span>
                        <span className="text-gray-500 ml-2">({unit.symbol})</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="text-red-600 hover:text-red-700 px-4 py-2 sm:px-3 sm:py-1.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-gray-900 mb-3">Satuan Penggunaan</h4>
                <div className="space-y-3 sm:space-y-2">
                  {units.filter(unit => unit.type === 'usage').map(unit => (
                    <div key={unit.id} className="flex items-center justify-between p-4 sm:p-3 border rounded-lg">
                      <div>
                        <span className="font-medium">{unit.name}</span>
                        <span className="text-gray-500 ml-2">({unit.symbol})</span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteUnit(unit.id)}
                        className="text-red-600 hover:text-red-700 px-4 py-2 sm:px-3 sm:py-1.5"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Channels */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Channel Penjualan
            </CardTitle>
            <CardDescription>
              Kelola platform penjualan dan komisi
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleAddChannel} className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  placeholder="Nama channel"
                  value={newChannel.name}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
                <Input
                  type="number"
                  placeholder="Komisi (%)"
                  value={newChannel.commission}
                  onChange={(e) => setNewChannel(prev => ({ ...prev, commission: parseFloat(e.target.value) || 0 }))}
                  min="0"
                  max="100"
                  step="0.1"
                />
                <Button type="submit" className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah
                </Button>
              </div>
            </form>

            <div className="space-y-3 sm:space-y-2 grid grid-cols-2 md:grid-cols-3 gap-4">
              {salesChannels.map(channel => (
                <div key={channel.id} className="flex items-center justify-between p-4 sm:p-3 border rounded-lg">
                  <div>
                    <span className="font-medium">{channel.name}</span>
                    <span className="text-gray-500 ml-2">Komisi: {channel.commission}%</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteChannel(channel.id)}
                    className="text-red-600 hover:text-red-700 px-4 py-2 sm:px-3 sm:py-1.5"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  )
}
