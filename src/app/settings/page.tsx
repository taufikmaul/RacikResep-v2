'use client'

import { useState, useEffect } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TrashIcon, CheckIcon, UpdateIcon, HomeIcon, MixerVerticalIcon, GlobeIcon, PersonIcon, LockClosedIcon, ImageIcon, RulerHorizontalIcon, DashIcon, AvatarIcon } from '@radix-ui/react-icons'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { FormField } from '@/components/forms/FormField'
import { FormActions } from '@/components/forms/FormActions'
import { TextareaField } from '@/components/forms/TextareaField'
import { Em, Heading, Strong, Text } from '@radix-ui/themes'
import { ThemeToggleWithLabel } from '@/components/ui/theme-toggle'


interface BusinessProfile {
  name: string
  address?: string
  phone?: string
  email: string
  currency: string
  language: string
  theme: string
  logo?: string
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

interface SkuSettings {
  id: string
  ingredientPrefix: string
  recipePrefix: string
  numberPadding: number
  separator: string
  nextIngredientNumber: number
  nextRecipeNumber: number
}

interface DecimalSettings {
  id: string
  decimalPlaces: number
  roundingMethod: 'round' | 'floor' | 'ceil'
  thousandSeparator: string
  decimalSeparator: string
  currencySymbol: string
  currencyPosition: 'before' | 'after'
  showTrailingZeros: boolean
}

export default function SettingsPage() {
  const { data: session, update } = useSession()
  const [business, setBusiness] = useState<BusinessProfile | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  
  // SKU Settings
  const [skuSettings, setSkuSettings] = useState({
    ingredientPrefix: 'ING',
    recipePrefix: 'RCP',
    numberPadding: 3,
    separator: '-',
    nextIngredientNumber: 1,
    nextRecipeNumber: 1
  })
  const [savingSku, setSavingSku] = useState(false)
  
  const saveSkuSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingSku(true)
    
    try {
      console.log('Saving SKU settings:', skuSettings)
      
      const response = await fetch('/api/settings/sku', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(skuSettings),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('SKU settings API error:', response.status, errorText)
        throw new Error(`Gagal menyimpan pengaturan SKU: ${response.status} ${errorText}`)
      }
      
      const result = await response.json()
      console.log('SKU settings saved successfully:', result)
      toast.success('Pengaturan SKU berhasil disimpan')
    } catch (error) {
      console.error('Error saving SKU settings:', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan pengaturan SKU'
      toast.error(errorMessage)
    } finally {
      setSavingSku(false)
    }
  }

  const saveDecimalSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSavingDecimal(true)
    
    try {
      console.log('Saving decimal settings:', decimalSettings)
      
      const response = await fetch('/api/settings/decimal', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(decimalSettings),
      })
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Decimal settings API error:', response.status, errorText)
        throw new Error(`Gagal menyimpan pengaturan format angka: ${response.status} ${errorText}`)
      }
      
      const result = await response.json()
      console.log('Decimal settings saved successfully:', result)
      toast.success('Pengaturan format angka berhasil disimpan')
    } catch (error) {
      console.error('Error saving decimal settings:', error)
      const errorMessage = error instanceof Error ? error.message : 'Gagal menyimpan pengaturan format angka'
      toast.error(errorMessage)
    } finally {
      setSavingDecimal(false)
    }
  }
  
  // account settings
  const [accountSaving, setAccountSaving] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [accountForm, setAccountForm] = useState({ name: '', email: '' })
  const [passwordForm, setPasswordForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' })
  
  // Form states
  const [businessForm, setBusinessForm] = useState<BusinessProfile>({
    name: '',
    address: '',
    phone: '',
    email: '',
    currency: 'IDR',
    language: 'id',
    theme: 'light',
    logo: ''
  })
  
  // Decimal Settings
  const [decimalSettings, setDecimalSettings] = useState<DecimalSettings>({
    id: '',
    decimalPlaces: 2,
    roundingMethod: 'round',
    thousandSeparator: ',',
    decimalSeparator: '.',
    currencySymbol: 'Rp',
    currencyPosition: 'before',
    showTrailingZeros: true
  })
  const [savingDecimal, setSavingDecimal] = useState(false)
  
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

  // Ensure business form is populated when business data changes
  useEffect(() => {
    if (business) {
      console.log('Business data changed, updating form:', business)
      setBusinessForm({
        name: business.name || '',
        address: business.address || '',
        phone: business.phone || '',
        email: business.email || '',
        currency: business.currency || 'IDR',
        language: business.language || 'id',
        theme: business.theme || 'light',
        logo: business.logo || ''
      })
    }
  }, [business])

  // Reset helpers for inline add forms
  const resetNewCategory = () => setNewCategory({ name: '', type: 'ingredient', color: '#6B7280' })
  const resetNewUnit = () => setNewUnit({ name: '', symbol: '', type: 'purchase' })
  const resetNewChannel = () => setNewChannel({ name: '', commission: 0 })

  const fetchData = async () => {
    try {
      const [businessRes, categoriesRes, unitsRes, channelsRes, skuSettingsRes, decimalSettingsRes] = await Promise.all([
        fetch('/api/business/profile'),
        fetch('/api/categories'),
        fetch('/api/units'),
        fetch('/api/sales-channels'),
        fetch('/api/settings/sku'),
        fetch('/api/settings/decimal')
      ])

      if (businessRes.ok) {
        const businessData = await businessRes.json()
        console.log('Fetched business data:', businessData)
        setBusiness(businessData)
        setBusinessForm({
          name: businessData.name || '',
          address: businessData.address || '',
          phone: businessData.phone || '',
          email: businessData.email || '',
          currency: businessData.currency || 'IDR',
          language: businessData.language || 'id',
          theme: businessData.theme || 'light',
          logo: businessData.logo || ''
        })
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

      if (skuSettingsRes.ok) {
        const skuSettingsData = await skuSettingsRes.json()
        setSkuSettings(skuSettingsData)
      }

      if (decimalSettingsRes.ok) {
        const decimalSettingsData = await decimalSettingsRes.json()
        setDecimalSettings(decimalSettingsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const resetAccountForm = () => {
    setAccountForm({ name: session?.user?.name || '', email: session?.user?.email || '' })
  }

  const resetPasswordForm = () => {
    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' })
  }

  const resetBusinessForm = () => {
    if (!business) return
    setBusinessForm({
      name: business.name || '',
      address: business.address || '',
      phone: business.phone || '',
      email: business.email || '',
      currency: business.currency || 'IDR',
      language: business.language || 'id',
      theme: business.theme || 'light',
      logo: business.logo || ''
    })
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
      setSaving(true)
      const response = await fetch('/api/business/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(businessForm)
      })

      if (response.ok) {
        const updatedBusiness = await response.json()
        setBusinessForm(updatedBusiness)
        
        toast.success('Profil bisnis berhasil diperbarui')
      } else {
        const error = await response.text()
        toast.error(`Gagal memperbarui profil: ${error}`)
      }
    } catch (error) {
      console.error('Error updating business profile:', error)
      toast.error('Terjadi kesalahan saat memperbarui profil')
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
        setNewUnit({ name: '', symbol: '', type: 'purchase' })
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 px-4 sm:px-6 lg:px-8 max-w-full overflow-hidden">
          <div className="animate-pulse">
            <div className="h-6 sm:h-8 bg-gray-200 rounded w-1/2 sm:w-1/4 mb-6"></div>
            <div className="grid gap-4 sm:gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 sm:h-40 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen">
        <div className="max-w-full overflow-hidden w-full">
          <div className="space-y-2 mb-5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">Pengaturan</h1>
            <p className="text-base sm:text-lg text-gray-600">
              Kelola pengaturan akun dan preferensi bisnis Anda
            </p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden w-full">
            <Tabs defaultValue="profile" className="w-full max-w-full">
              <div className="">
                <TabsList className="w-full justify-start overflow-x-auto py-2 bg-transparent rounded-none px-2 sm:px-6 h-auto sm:h-14 scrollbar-hide tabs-scroll-container mobile-tabs-container">
                  <TabsTrigger 
                    value="profile" 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none hover:text-blue-600/80 rounded-none whitespace-nowrap mobile-tab-trigger"
                  >
                    <PersonIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Profil Bisnis</span>
                    <span className="sm:hidden">Profil</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sku" 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none hover:text-blue-600/80 rounded-none whitespace-nowrap mobile-tab-trigger"
                  >
                    <DashIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Pengaturan SKU</span>
                    <span className="sm:hidden">SKU</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="decimal" 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none hover:text-blue-600/80 rounded-none whitespace-nowrap mobile-tab-trigger"
                  >
                    <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Format Angka</span>
                    <span className="sm:hidden">Angka</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="categories" 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none hover:text-blue-600/80 rounded-none whitespace-nowrap mobile-tab-trigger"
                  >
                    <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Kategori</span>
                    <span className="sm:hidden">Kategori</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="units" 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none hover:text-blue-600/80 rounded-none whitespace-nowrap mobile-tab-trigger"
                  >
                    <RulerHorizontalIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Satuan</span>
                    <span className="sm:hidden">Satuan</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="channels" 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none hover:text-blue-600/80 rounded-none whitespace-nowrap mobile-tab-trigger"
                  >
                    <CheckIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Saluran Penjualan</span>
                    <span className="sm:hidden">Channel</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="account" 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none hover:text-blue-600/80 rounded-none whitespace-nowrap mobile-tab-trigger"
                  >
                    <AvatarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Akun</span>
                    <span className="sm:hidden">Akun</span>
                  </TabsTrigger>
                  <TabsTrigger 
                    value="theme" 
                    className="px-3 sm:px-6 py-2 sm:py-3 text-xs sm:text-sm font-medium transition-all duration-200 data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:shadow-none hover:text-blue-600/80 rounded-none whitespace-nowrap mobile-tab-trigger"
                  >
                    <MixerVerticalIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Tema</span>
                    <span className="sm:hidden">Tema</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Profile Tab */}
              <TabsContent value="profile" className="mt-4 sm:mt-8 space-y-4 sm:space-y-6">
                <form onSubmit={handleBusinessUpdate} className="space-y-4 sm:px-5 sm:space-y-6 max-w-full sm:max-w-2xl">
                  {loading ? (
                    <div className="flex items-center justify-center py-8">
                      <UpdateIcon className="h-6 w-6 animate-spin mr-2" />
                      <span>Memuat data bisnis...</span>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-4">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                          <FormField 
                            label="Nama Bisnis" 
                            htmlFor="business-name"
                            description="Nama resmi bisnis Anda"
                          >
                            <Input 
                              id="business-name"
                              value={businessForm.name}
                              onChange={(e) => setBusinessForm(p => ({ ...p, name: e.target.value }))}
                              placeholder="Nama Bisnis Anda"
                              required 
                            />
                          </FormField>
                          
                          <FormField 
                            label="Email Bisnis" 
                            htmlFor="business-email"
                            description="Email resmi bisnis"
                          >
                            <Input 
                              id="business-email"
                              type="email" 
                              value={businessForm.email}
                              onChange={(e) => setBusinessForm(p => ({ ...p, email: e.target.value }))}
                              placeholder="email@bisnis.com"
                              required 
                            />
                          </FormField>
                        </div>
                        
                        <FormField 
                          label="Logo Bisnis" 
                          htmlFor="business-logo"
                          description="Upload logo bisnis untuk ditampilkan di sidebar dan branding"
                        >
                          <div className="space-y-3">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                              <div className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center border-2 border-dashed border-gray-300 bg-gray-50 flex-shrink-0">
                                {businessForm.logo ? (
                                  // eslint-disable-next-line @next/next/no-img-element
                                  <img src={businessForm.logo} alt="Logo Preview" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="text-xs text-gray-500 text-center">
                                    <ImageIcon className="w-6 h-6 mx-auto mb-1" />
                                    No Logo
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 w-full sm:w-auto min-w-0">
                                <Input
                                  type="file"
                                  accept="image/*"
                                  onChange={handleLogoUpload}
                                  className="h-10 w-full"
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                  PNG, JPG, WEBP (max 2MB)
                                </div>
                              </div>
                            </div>
                            {businessForm.logo && (
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setBusinessForm(prev => ({ ...prev, logo: '' }))}
                                >
                                  <TrashIcon className="h-4 w-4 mr-1" />
                                  Hapus Logo
                                </Button>
                              </div>
                            )}
                          </div>
                        </FormField>
                        
                        <FormField 
                          label="Alamat Bisnis" 
                          htmlFor="business-address"
                          description="Alamat lengkap bisnis Anda"
                        >
                          <TextareaField
                            value={businessForm.address || ''}
                            onChange={(e) => setBusinessForm(p => ({ ...p, address: e }))}
                            placeholder="Jl. Contoh No. 123, Kota, Kode Pos"
                            rows={3}
                            className="w-full resize-none"
                          />
                        </FormField>
                        
                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                          <FormField 
                            label="Nomor Telepon" 
                            htmlFor="business-phone"
                          >
                            <Input 
                              id="business-phone"
                              value={businessForm.phone || ''}
                              onChange={(e) => setBusinessForm(p => ({ ...p, phone: e.target.value }))}
                              placeholder="+62 123 4567 8900"
                            />
                          </FormField>
                          
                          <FormField 
                            label="Mata Uang" 
                            htmlFor="currency"
                          >
                            <Select
                              value={businessForm.currency}
                              onValueChange={(value) => setBusinessForm(p => ({ ...p, currency: value }))}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih mata uang" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="IDR">Rupiah (IDR)</SelectItem>
                                <SelectItem value="USD">US Dollar (USD)</SelectItem>
                                <SelectItem value="SGD">Singapore Dollar (SGD)</SelectItem>
                                <SelectItem value="MYR">Malaysian Ringgit (MYR)</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>
                        </div>
                        
                      </div>
                      
                      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full sm:w-auto order-2 sm:order-1"
                          onClick={resetBusinessForm}
                        >
                          Batal
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full sm:w-auto order-1 sm:order-2"
                          disabled={saving}
                        >
                          {saving ? (
                            <>
                              <UpdateIcon className="mr-2 h-4 w-4 animate-spin" />
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="mr-2 h-4 w-4" />
                              Simpan Perubahan
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                </form>
              </TabsContent>

              {/* SKU Settings Tab */}
              <TabsContent value="sku" className="space-y-4">
                  <div className="px-5 py-5">
                    <div className="space-y-2 mb-5">
                      <Text>
                        <Heading mb="2" size="3" className="flex items-center gap-2">
                          Pengaturan SKU
                        </Heading>
                        Konfigurasi format SKU untuk bahan baku dan resep
                      </Text>
                    </div>
                    <form onSubmit={saveSkuSettings} className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-4">
                          <h3 className="font-medium">Awalan SKU</h3>
                          <FormField
                            label="Awalan Bahan Baku"
                            helper="Awalan untuk SKU bahan baku (contoh: ING)"
                            htmlFor="ingredient-prefix"
                          >
                            <Input
                              id="ingredient-prefix"
                              value={skuSettings.ingredientPrefix}
                              onChange={(e) =>
                                setSkuSettings({
                                  ...skuSettings,
                                  ingredientPrefix: e.target.value.toUpperCase(),
                                })
                              }
                              maxLength={5}
                            />
                          </FormField>
                          <FormField
                            label="Awalan Resep"
                            helper="Awalan untuk SKU resep (contoh: RCP)"
                            htmlFor="recipe-prefix"
                          >
                            <Input
                              id="recipe-prefix"
                              value={skuSettings.recipePrefix}
                              onChange={(e) =>
                                setSkuSettings({
                                  ...skuSettings,
                                  recipePrefix: e.target.value.toUpperCase(),
                                })
                              }
                              maxLength={5}
                            />
                          </FormField>
                        </div>
                        <div className="space-y-4">
                          <h3 className="font-medium">Format Nomor</h3>
                          <FormField
                            label="Panjang Digit"
                            helper="Jumlah digit untuk nomor urut (contoh: 3 = 001, 4 = 0001)"
                          >
                            <Input
                              id="number-padding"
                              type="number"
                              min="1"
                              max="6"
                              value={skuSettings.numberPadding.toString()}
                              onChange={(e) =>
                                setSkuSettings({
                                  ...skuSettings,
                                  numberPadding: parseInt(e.target.value) || 3,
                                })
                              }
                            />
                          </FormField>
                          <FormField
                            label="Pemisah"
                            helper="Karakter pemisah antara awalan dan nomor (contoh: -)"
                            htmlFor="separator"
                          >
                            <Input
                              id="separator"
                              value={skuSettings.separator}
                              onChange={(e) =>
                                setSkuSettings({
                                  ...skuSettings,
                                  separator: e.target.value,
                                })
                              }
                              maxLength={3}
                            />
                          </FormField>
                        </div>
                      </div>
                      <div className="space-y-4 pt-4 border-t">
                        <h3 className="font-medium">Nomor Berikutnya</h3>
                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                          <FormField
                            label="Nomor Bahan Baku Berikutnya"
                            htmlFor="next-ingredient-number"
                          >
                            <Input
                              id="next-ingredient-number"
                              type="number"
                              min="1"
                              value={skuSettings.nextIngredientNumber.toString()}
                              onChange={(e) =>
                                setSkuSettings({
                                  ...skuSettings,
                                  nextIngredientNumber: parseInt(e.target.value) || 1,
                                })
                              }
                            />
                          </FormField>
                          <FormField
                            label="Nomor Resep Berikutnya"
                            htmlFor="next-recipe-number"
                          >
                            <Input
                              id="next-recipe-number"
                              type="number"
                              min="1"
                              value={skuSettings.nextRecipeNumber.toString()}
                              onChange={(e) =>
                                setSkuSettings({
                                  ...skuSettings,
                                  nextRecipeNumber: parseInt(e.target.value) || 1,
                                })
                              }
                            />
                          </FormField>
                        </div>
                      </div>
                      <div className="pt-4">
                        <Button type="submit" disabled={savingSku} className="w-full sm:w-auto">
                          {savingSku ? (
                            <>
                              <UpdateIcon className="mr-2 h-4 w-4 animate-spin" />
                              Menyimpan...
                            </>
                          ) : (
                            'Simpan Pengaturan SKU'
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
              </TabsContent>

              {/* Decimal Settings Tab */}
              <TabsContent value="decimal" className="space-y-4">
                  <div className="px-5 py-5">
                    <div className="space-y-2 mb-5">
                      <Text>
                        <Heading mb="2" size="3" className="flex items-center gap-2">
                          <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          Pengaturan Format Angka
                        </Heading>
                        Konfigurasi format tampilan angka dan mata uang
                      </Text>
                    </div>
                    <form onSubmit={saveDecimalSettings} className="space-y-4 sm:space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                        <div className="space-y-4">
                          <h3 className="font-medium">Pengaturan Angka</h3>
                          <FormField
                            label="Jumlah Desimal"
                            helper="Jumlah angka di belakang koma (contoh: 2 = 1.23)"
                          >
                            <Input
                              id="decimal-places"
                              type="number"
                              min="0"
                              max="6"
                              value={decimalSettings.decimalPlaces.toString()}
                              onChange={(e) =>
                                setDecimalSettings({
                                  ...decimalSettings,
                                  decimalPlaces: parseInt(e.target.value) || 2,
                                })
                              }
                            />
                          </FormField>
                          <FormField
                            label="Metode Pembulatan"
                            helper="Metode pembulatan angka (round, floor, ceil)"
                          >
                            <Select
                              value={decimalSettings.roundingMethod}
                              onValueChange={(value) =>
                                setDecimalSettings({
                                  ...decimalSettings,
                                  roundingMethod: value as 'round' | 'floor' | 'ceil',
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih metode pembulatan" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="round">Round</SelectItem>
                                <SelectItem value="floor">Floor</SelectItem>
                                <SelectItem value="ceil">Ceil</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField
                            label="Pemisah Ribuan"
                            helper="Karakter pemisah ribuan (contoh: .)"
                            htmlFor="thousand-separator"
                          >
                            <Input
                              id="thousand-separator"
                              value={decimalSettings.thousandSeparator}
                              onChange={(e) =>
                                setDecimalSettings({
                                  ...decimalSettings,
                                  thousandSeparator: e.target.value,
                                })
                              }
                              maxLength={3}
                            />
                          </FormField>
                          <FormField
                            label="Pemisah Desimal"
                            helper="Karakter pemisah desimal (contoh: ,)"
                            htmlFor="decimal-separator"
                          >
                            <Input
                              id="decimal-separator"
                              value={decimalSettings.decimalSeparator}
                              onChange={(e) =>
                                setDecimalSettings({
                                  ...decimalSettings,
                                  decimalSeparator: e.target.value,
                                })
                              }
                              maxLength={3}
                            />
                          </FormField>
                        </div>
                        <div className="space-y-4">
                          <h3 className="font-medium">Pengaturan Mata Uang</h3>
                          <FormField
                            label="Simbol Mata Uang"
                            helper="Simbol yang digunakan sebelum angka (contoh: Rp)"
                            htmlFor="currency-symbol"
                          >
                            <Input
                              id="currency-symbol"
                              value={decimalSettings.currencySymbol}
                              onChange={(e) =>
                                setDecimalSettings({
                                  ...decimalSettings,
                                  currencySymbol: e.target.value,
                                })
                              }
                              maxLength={5}
                            />
                          </FormField>
                          <FormField
                            label="Posisi Simbol"
                            helper="Posisi simbol sebelum atau sesudah angka"
                          >
                            <Select
                              value={decimalSettings.currencyPosition}
                              onValueChange={(value) =>
                                setDecimalSettings({
                                  ...decimalSettings,
                                  currencyPosition: value as 'before' | 'after',
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih posisi simbol" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="before">Sebelum Angka</SelectItem>
                                <SelectItem value="after">Sesudah Angka</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>
                          <FormField
                            label="Tampilkan Nol Akhir"
                            helper="Menampilkan angka nol di belakang koma"
                          >
                            <Select
                              value={decimalSettings.showTrailingZeros.toString()}
                              onValueChange={(value) =>
                                setDecimalSettings({
                                  ...decimalSettings,
                                  showTrailingZeros: value === 'true',
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Pilih opsi" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="true">Ya</SelectItem>
                                <SelectItem value="false">Tidak</SelectItem>
                              </SelectContent>
                            </Select>
                          </FormField>
                        </div>
                      </div>
                      <div className="pt-4">
                        <Button type="submit" disabled={savingDecimal} className="w-full sm:w-auto">
                          {savingDecimal ? (
                            <>
                              <UpdateIcon className="mr-2 h-4 w-4 animate-spin" />
                              Menyimpan...
                            </>
                          ) : (
                            'Simpan Pengaturan Format Angka'
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
              </TabsContent>

              {/* Categories Tab */}
              <TabsContent value="categories" className="space-y-4">
                  <div className="px-5 py-5">
                    <div className="space-y-2 mb-5">
                      <Text>
                        <Heading mb="2" size="3" className="flex items-center gap-2">
                        <MixerVerticalIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        Manajemen Kategori
                        </Heading>
                        Kelola kategori untuk bahan baku dan resep
                      </Text>
                    </div>
                    <form onSubmit={handleAddCategory} className="mb-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                        <FormField label="Nama kategori" required>
                          <Input
                            placeholder="Nama kategori"
                            value={newCategory.name}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, name: e.target.value }))}
                            required
                          />
                        </FormField>
                        <FormField label="Tipe" required>
                          <Select
                            value={newCategory.type}
                            onValueChange={(value) => setNewCategory(prev => ({ ...prev, type: value }))}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="ingredient">Bahan Baku</SelectItem>
                              <SelectItem value="recipe">Resep</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormField>
                        <FormField label="Warna" helper="Pilih warna indikator">
                          <input
                            type="color"
                            value={newCategory.color}
                            onChange={(e) => setNewCategory(prev => ({ ...prev, color: e.target.value }))}
                            className="w-full h-10 border border-gray-300 rounded-md min-w-0"
                          />
                        </FormField>
                        <div className="flex items-end">
                          <FormActions onCancel={resetNewCategory} loading={false} submitText="Tambah" />
                        </div>
                      </div>
                    </form>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {categories.map(category => (
                        <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                            <div
                              className="w-3 h-3 sm:w-4 sm:h-4 rounded-full flex-shrink-0"
                              style={{ backgroundColor: category.color }}
                            ></div>
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{category.name}</div>
                              <div className="text-xs sm:text-sm text-gray-500 capitalize">{category.type}</div>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id)}
                            className="text-red-600 hover:text-red-700 px-2 py-1 sm:px-3 sm:py-1.5 flex-shrink-0"
                          >
                            <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
              </TabsContent>

              {/* Units Tab */}
              <TabsContent value="units" className="space-y-4">
                <div className="px-5 py-5">
                  <div className="space-y-2 mb-5">
                    <Text>
                      <Heading mb="2" size="3" className="flex items-center gap-2">
                        <GlobeIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        Manajemen Satuan
                      </Heading>
                      Kelola satuan pembelian dan penggunaan
                    </Text>
                  </div>
                  <form onSubmit={handleAddUnit} className="mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                      <FormField label="Nama satuan" required>
                        <Input
                          placeholder="Nama satuan"
                          value={newUnit.name}
                          onChange={(e) => setNewUnit(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </FormField>
                      <FormField label="Simbol" required>
                        <Input
                          placeholder="Simbol"
                          value={newUnit.symbol}
                          onChange={(e) => setNewUnit(prev => ({ ...prev, symbol: e.target.value }))}
                          required
                        />
                      </FormField>
                      <FormField label="Tipe" required>
                        <Select
                          value={newUnit.type}
                          onValueChange={(value) => setNewUnit(prev => ({ ...prev, type: value }))}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="purchase">Pembelian</SelectItem>
                            <SelectItem value="usage">Penggunaan</SelectItem>
                          </SelectContent>
                        </Select>
                      </FormField>
                      <div className="flex items-end">
                        <FormActions onCancel={resetNewUnit} loading={false} submitText="Tambah" />
                      </div>
                    </div>
                  </form>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-3 text-gray-900 text-sm sm:text-base">Satuan Pembelian</h4>
                      <div className="space-y-2 grid grid-cols-2 gap-3">
                        {units.filter(unit => unit.type === 'purchase').map(unit => (
                          <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{unit.name}</div>
                              <div className="text-xs sm:text-sm text-gray-600">({unit.symbol})</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUnit(unit.id)}
                              className="text-red-600 hover:text-red-700 px-2 py-1 sm:px-3 sm:py-1.5 flex-shrink-0"
                            >
                              <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium mb-3 text-gray-900 text-sm sm:text-base">Satuan Penggunaan</h4>
                      <div className="space-y-2 grid grid-cols-2 gap-3">
                        {units.filter(unit => unit.type === 'usage').map(unit => (
                          <div key={unit.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="min-w-0 flex-1">
                              <div className="font-medium truncate">{unit.name}</div>
                              <div className="text-xs sm:text-sm text-gray-600">({unit.symbol})</div>
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteUnit(unit.id)}
                              className="text-red-600 hover:text-red-700 px-2 py-1 sm:px-3 sm:py-1.5 flex-shrink-0"
                            >
                              <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Sales Channels Tab */}
              <TabsContent value="channels" className="space-y-4">
                <div className="px-5 py-5">
                  <div className="space-y-2 mb-5">
                    <Text>
                      <Heading mb="2" size="3" className="flex items-center gap-2">
                        <CheckIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        Channel Penjualan
                      </Heading>
                      Kelola platform penjualan dan komisi
                    </Text>
                  </div>
                  <form onSubmit={handleAddChannel} className="mb-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      <FormField label="Nama channel" required>
                        <Input
                          placeholder="Nama channel"
                          value={newChannel.name}
                          onChange={(e) => setNewChannel(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </FormField>
                      <FormField label="Komisi (%)" helper="0 - 100">
                        <Input
                          type="number"
                          placeholder="Komisi (%)"
                          value={newChannel.commission.toString()}
                          onChange={(e) => {
                            const value = e.target.value
                            if (value === '' || value === '0') {
                              setNewChannel({
                                ...newChannel,
                                commission: 0,
                              })
                            } else {
                              const parsed = parseFloat(value)
                              if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                                setNewChannel({
                                  ...newChannel,
                                  commission: parsed,
                                })
                              }
                            }
                          }}
                          min={0}
                          max={100}
                          step={0.1}
                        />
                      </FormField>
                      <div className="flex items-end">
                        <FormActions onCancel={resetNewChannel} loading={false} submitText="Tambah" />
                      </div>
                    </div>
                  </form>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
                    {salesChannels.map(channel => (
                      <div key={channel.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="min-w-0 flex-1">
                          <div className="font-medium truncate">{channel.name}</div>
                          <div className="text-xs sm:text-sm text-gray-500">Komisi: {channel.commission}%</div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteChannel(channel.id)}
                          className="text-red-600 hover:text-red-700 px-2 py-1 sm:px-3 sm:py-1.5 flex-shrink-0"
                        >
                          <TrashIcon className="h-3 w-3 sm:h-4 sm:w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              </TabsContent>

              {/* Account Tab */}
              <TabsContent value="account" className="space-y-4">
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  <div className="px-5 py-5">
                    <div className="space-y-2 mb-5">
                      <Text>
                        <Heading mb="2" size="3" className="flex items-center gap-2">
                          <AvatarIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                          Profil Akun
                        </Heading>
                        Kelola informasi akun pribadi Anda
                      </Text>
                    </div>
                    <form onSubmit={handleAccountUpdate} className="space-y-4 sm:space-y-6 max-w-full sm:max-w-2xl">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 gap-4 sm:gap-6">
                          <FormField 
                            label="Nama Lengkap" 
                            htmlFor="account-name"
                            description="Nama lengkap Anda"
                          >
                            <Input 
                              id="account-name"
                              value={accountForm.name}
                              onChange={(e) => setAccountForm(p => ({ ...p, name: e.target.value }))}
                              placeholder="Nama Lengkap"
                              required 
                            />
                          </FormField>
                          
                          <FormField 
                            label="Email" 
                            htmlFor="account-email"
                            description="Email akun Anda"
                          >
                            <Input 
                              id="account-email"
                              type="email" 
                              value={accountForm.email}
                              onChange={(e) => setAccountForm(p => ({ ...p, email: e.target.value }))}
                              placeholder="email@example.com"
                              required 
                            />
                          </FormField>
                        </div>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-800">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="w-full sm:w-auto order-2 sm:order-1"
                          onClick={resetAccountForm}
                        >
                          Batal
                        </Button>
                        <Button 
                          type="submit" 
                          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-colors w-full sm:w-auto order-1 sm:order-2"
                          disabled={accountSaving}
                        >
                          {accountSaving ? (
                            <>
                              <UpdateIcon className="mr-2 h-4 w-4 animate-spin" />
                              Menyimpan...
                            </>
                          ) : (
                            <>
                              <CheckIcon className="mr-2 h-4 w-4" />
                              Simpan Perubahan
                            </>
                          )}
                        </Button>
                      </div>
                    </form>
                  </div>
                  <div className="px-5 py-5">
                    <div className="space-y-2 mb-5">
                      <Text>
                        <Heading mb="2" size="3" className="flex items-center gap-2">
                          Ganti Password
                        </Heading>
                        Atur password baru untuk akun Anda
                      </Text>
                    </div>
                    <form onSubmit={handlePasswordChange} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Password Saat Ini</label>
                        <Input type="password" value={passwordForm.currentPassword} onChange={(e) => setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))} required />
                      </div>
                      <div className="grid grid-cols-1 gap-4">
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
                        {passwordSaving ? (<><UpdateIcon className="mr-2 h-4 w-4 animate-spin" /> Menyimpan...</>) : 'Ubah Password'}
                      </Button>
                    </form>
                  </div>
                </div>
              </TabsContent>

              {/* Theme Tab */}
              <TabsContent value="theme" className="space-y-4">
                <div className="px-5 py-5">
                  <div className="space-y-2 mb-5">
                    <Text>
                      <Heading mb="2" size="3" className="flex items-center gap-2">
                        <MixerVerticalIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        Pengaturan Tema
                      </Heading>
                      Sesuaikan tampilan aplikasi sesuai preferensi Anda
                    </Text>
                  </div>
                  
                  <div className="space-y-6">
                    {/* Theme Toggle */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                            Mode Tema
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400">
                            Pilih antara mode terang dan gelap untuk tampilan aplikasi
                          </p>
                        </div>
                        <ThemeToggleWithLabel />
                      </div>
                    </div>

                    {/* Theme Preview */}
                    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        Preview Tema
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-50 dark:bg-gray-700 dark:border-gray-600">
                          <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Mode Terang</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Tampilan cerah dengan latar belakang putih dan teks gelap
                          </p>
                        </div>
                        <div className="p-4 rounded-lg border-2 border-gray-200 bg-gray-800 dark:bg-gray-700 dark:border-gray-600">
                          <h4 className="font-medium text-gray-100 mb-2">Mode Gelap</h4>
                          <p className="text-sm text-gray-300">
                            Tampilan gelap dengan latar belakang hitam dan teks terang
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Theme Information */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-6 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-white text-sm">💡</span>
                        </div>
                        <div>
                          <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                            Tips Penggunaan
                          </h4>
                          <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                            <li>• Tema akan otomatis tersimpan di browser Anda</li>
                            <li>• Aplikasi akan mengingat preferensi tema Anda</li>
                            <li>• Tema dapat diubah kapan saja dari menu ini atau tombol toggle di header</li>
                            <li>• Perubahan tema berlaku untuk seluruh aplikasi</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
