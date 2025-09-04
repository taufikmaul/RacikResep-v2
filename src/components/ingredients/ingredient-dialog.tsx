'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Loader2 } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'

interface Category {
  id: string
  name: string
  color: string
}

interface Unit {
  id: string
  name: string
  symbol: string
}

interface IngredientFormData {
  id?: string
  sku?: string
  name: string
  description?: string
  categoryId?: string
  purchasePrice: number
  purchaseQuantity: number
  purchaseUnitId: string
  usageUnitId: string
  conversionFactor: number
  packageSize?: number
  costPerUnit?: number
}

interface IngredientDialogProps {
  ingredient?: IngredientFormData
  isOpen: boolean
  onClose: () => void
  onSave: (ingredient: Omit<IngredientFormData, 'id'>) => Promise<void>
}

export function IngredientDialog({ ingredient, isOpen, onClose, onSave }: IngredientDialogProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [formData, setFormData] = useState<Omit<IngredientFormData, 'id'>>({
    sku: '',
    name: '',
    description: '',
    categoryId: '',
    purchasePrice: 0,
    purchaseQuantity: 1,
    purchaseUnitId: '',
    usageUnitId: '',
    conversionFactor: 1
  })
  const [categories, setCategories] = useState<Category[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [loading, setLoading] = useState(false)
  const [usageLoading, setUsageLoading] = useState(false)
  const [usageCount, setUsageCount] = useState<number>(0)
  const [usageRecipes, setUsageRecipes] = useState<Array<{ id: string; name: string; imageUrl?: string | null }>>([])

  useEffect(() => {
    if (ingredient) {
      setFormData({
        sku: ingredient.sku || '',
        name: ingredient.name,
        description: ingredient.description || '',
        categoryId: ingredient.categoryId || '',
        purchasePrice: ingredient.purchasePrice,
        purchaseQuantity: ingredient.packageSize || 1,
        purchaseUnitId: ingredient.purchaseUnitId,
        usageUnitId: ingredient.usageUnitId,
        conversionFactor: ingredient.conversionFactor || 1
      })
    } else {
      setFormData({
        sku: '',
        name: '',
        description: '',
        categoryId: '',
        purchasePrice: 0,
        purchaseQuantity: 1,
        purchaseUnitId: '',
        usageUnitId: '',
        conversionFactor: 1
      })
    }
  }, [ingredient])

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      fetchUnits()
      // Load usage info only when editing existing ingredient
      if (ingredient?.id) {
        fetchUsageInfo(ingredient.id)
      } else {
        setUsageCount(0)
        setUsageRecipes([])
      }
    }
  }, [isOpen])

  const fetchUsageInfo = async (id: string) => {
    try {
      setUsageLoading(true)
      const res = await fetch(`/api/ingredients/${id}`)
      if (res.ok) {
        const data = await res.json()
        setUsageCount(data.usageCount || 0)
        setUsageRecipes(Array.isArray(data.recipes) ? data.recipes : [])
      }
    } catch (error) {
      console.error('Error fetching usage info:', error)
    } finally {
      setUsageLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?type=ingredient')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Gagal memuat kategori')
    }
  }

  const fetchUnits = async () => {
    try {
      const response = await fetch('/api/units')
      if (response.ok) {
        const data = await response.json()
        setUnits(data)
      }
    } catch (error) {
      console.error('Error fetching units:', error)
      toast.error('Gagal memuat satuan')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validate required fields
    if (!formData.name.trim()) {
      toast.error('Nama bahan baku harus diisi')
      return
    }
    
    if (!formData.purchaseUnitId) {
      toast.error('Satuan beli harus dipilih')
      return
    }
    
    if (!formData.usageUnitId) {
      toast.error('Satuan pakai harus dipilih')
      return
    }
    
    if (formData.purchasePrice <= 0) {
      toast.error('Harga beli harus lebih dari 0')
      return
    }
    
    if (formData.purchaseQuantity <= 0) {
      toast.error('Jumlah beli harus lebih dari 0')
      return
    }
    
    if (formData.conversionFactor <= 0) {
      toast.error('Faktor konversi harus lebih dari 0')
      return
    }
    
    setLoading(true)
    
    try {
      await onSave(formData)
      toast.success(ingredient ? 'Bahan baku berhasil diperbarui' : 'Bahan baku berhasil ditambahkan')
      onClose()
    } catch (error) {
      console.error('Error saving ingredient:', error)
      toast.error('Gagal menyimpan bahan baku')
    } finally {
      setLoading(false)
    }
  }

  const pricePerUnit = formData.purchasePrice / (formData.purchaseQuantity * formData.conversionFactor)

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={ingredient ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'} 
      size="lg"
      footer={
        <>
          <Button 
            type="button" 
            variant="outline" 
            onClick={onClose} 
            className="flex-1 h-12 border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200 rounded-lg font-medium" 
            disabled={loading}
          >
            ❌ Batal
          </Button>
          <Button 
            type="button" 
            onClick={() => formRef.current?.requestSubmit()}
            disabled={loading} 
            className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Menyimpan...
              </>
            ) : (
              <>
                💾 Simpan Bahan Baku
              </>
            )}
          </Button>
        </>
      }
    >
      <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Basic Information Section */}
          <div  style={{ 
                  background: "var(--color-panel-solid)"
                }} 
                className="rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📝</span>
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Informasi Dasar
              </h3>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Nama Bahan Baku
                </label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg"
                  placeholder="Masukkan nama bahan baku"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  SKU (opsional)
                </label>
                <Input
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  placeholder="Contoh: ING-001"
                  className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg font-mono"
                />
                <p className="text-xs mt-2 text-gray-500 bg-blue-50 p-2 rounded-md border border-blue-200">
                  💡 Kode unik untuk identifikasi bahan baku. Kosongkan untuk generate otomatis.
                </p>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Deskripsi (opsional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full rounded-lg px-3 py-2 text-sm border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  placeholder="Deskripsi singkat tentang bahan baku"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Kategori
                </label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
                >
                  <SelectTrigger 
                    className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg"
                  >
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem 
                        key={category.id} 
                        value={category.id}
                        className="hover:bg-blue-50 cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: category.color }}
                          />
                          {category.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Pricing Section */}
          <div  style={{ 
                  background: "var(--color-panel-solid)"
                }} 
                className="rounded-xl p-6 shadow-sm border border-green-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">💰</span>
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Informasi Harga & Pembelian
              </h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Harga Beli
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 font-medium">Rp</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.purchasePrice.toString()}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || value === '0') {
                        setFormData({ ...formData, purchasePrice: 0 })
                      } else {
                        const parsed = parseFloat(value)
                        if (!isNaN(parsed) && parsed >= 0) {
                          setFormData({ ...formData, purchasePrice: parsed })
                        }
                      }
                    }}
                    className="h-11 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 rounded-lg pl-10"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Jumlah Beli
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.purchaseQuantity.toString()}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || value === '0') {
                      setFormData({ ...formData, purchaseQuantity: 1 })
                    } else {
                      const parsed = parseFloat(value)
                      if (!isNaN(parsed) && parsed > 0) {
                        setFormData({ ...formData, purchaseQuantity: parsed })
                      }
                    }
                  }}
                  className="h-11 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 rounded-lg"
                  placeholder="1.00"
                />
              </div>
            </div>
          </div>

          {/* Units & Conversion Section */}
          <div  style={{ 
                  background: "var(--color-panel-solid)"
                }} 
                className="rounded-xl p-6 shadow-sm border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">📏</span>
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                Satuan & Konversi
              </h3>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Satuan Beli
                  </label>
                  <Select
                    value={formData.purchaseUnitId}
                    onValueChange={(value) => setFormData({ ...formData, purchaseUnitId: value })}
                  >
                    <SelectTrigger 
                      className="h-11 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 rounded-lg"
                    >
                      <SelectValue placeholder="Pilih Satuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem 
                          key={unit.id} 
                          value={unit.id}
                          className="hover:bg-purple-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-purple-600 font-medium">{unit.symbol}</span>
                            {unit.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2 text-gray-700">
                    Satuan Pakai
                  </label>
                  <Select
                    value={formData.usageUnitId}
                    onValueChange={(value) => setFormData({ ...formData, usageUnitId: value })}
                  >
                    <SelectTrigger 
                      className="h-11 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 rounded-lg"
                    >
                      <SelectValue placeholder="Pilih Satuan" />
                    </SelectTrigger>
                    <SelectContent>
                      {units.map((unit) => (
                        <SelectItem 
                          key={unit.id} 
                          value={unit.id}
                          className="hover:bg-purple-50 cursor-pointer"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-purple-600 font-medium">{unit.symbol}</span>
                            {unit.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Faktor Konversi
                </label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.conversionFactor.toString()}
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || value === '0') {
                      setFormData({ ...formData, conversionFactor: 1 })
                    } else {
                      const parsed = parseFloat(value)
                      if (!isNaN(parsed) && parsed > 0) {
                        setFormData({ ...formData, conversionFactor: parsed })
                      }
                    }
                  }}
                  className="h-11 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 rounded-lg"
                  placeholder="1.00"
                />
                <p className="text-xs mt-2 text-gray-500 bg-purple-50 p-2 rounded-md border border-purple-200">
                  🔄 Berapa satuan pakai dalam 1 satuan beli
                </p>
              </div>
            </div>
          </div>

          {/* Price Calculation Display - Fixed Position */}
          <div className="sticky top-4 z-10 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 shadow-xl border border-blue-200 backdrop-blur-sm border-l-4 border-l-blue-500">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">🧮</span>
              </div>
              <h3 className="text-lg font-semibold text-blue-700">
                Kalkulasi Harga
              </h3>
            </div>
            
            <div  style={{ 
                  background: "var(--color-panel-solid)"
                }} 
                className="rounded-lg p-4 border border-blue-200 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">
                  Harga per {units.find(u => u.id === formData.usageUnitId)?.symbol || 'unit'}:
                </span>
                <span className="text-lg font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">
                  Rp {pricePerUnit.toLocaleString('id-ID')}
                </span>
              </div>
              <div className="mt-2 text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-100">
                💡 Harga ini dihitung otomatis berdasarkan harga beli, jumlah beli, dan faktor konversi
              </div>
            </div>
          </div>

          {/* Usage Information Section */}
          {ingredient?.id && (
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl p-6 shadow-sm border border-orange-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🍳</span>
                </div>
                <h3 className="text-lg font-semibold text-orange-700">
                  Penggunaan dalam Resep
                </h3>
              </div>
              
              <div  style={{ 
                  background: "var(--color-panel-solid)"
                }} 
                className="rounded-lg p-4 border border-orange-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Total Resep yang Menggunakan:
                  </span>
                  <span className="text-sm font-bold text-orange-600 bg-orange-100 px-3 py-1 rounded-full">
                    {usageLoading ? 'Memuat...' : `${usageCount} resep`}
                  </span>
                </div>
                
                {!usageLoading && usageRecipes.length > 0 && (
                  <div className="space-y-2 max-h-40 overflow-auto pr-1">
                    {usageRecipes.map(r => (
                      <div key={r.id} className="flex items-center gap-3 p-2 bg-orange-50 rounded-lg border border-orange-100 hover:bg-orange-100 transition-colors duration-200">
                        {r.imageUrl ? (
                          <Image src={r.imageUrl} alt={r.name} width={32} height={32} className="w-8 h-8 rounded-lg object-cover border border-orange-200" />
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-200 to-amber-200 flex items-center justify-center">
                            <span className="text-orange-600 text-sm">🍽️</span>
                          </div>
                        )}
                        <span className="text-sm font-medium text-gray-700">{r.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {!usageLoading && usageRecipes.length === 0 && (
                  <div className="text-center py-4">
                    <div className="w-12 h-12 mx-auto mb-2 bg-orange-100 rounded-full flex items-center justify-center">
                      <span className="text-orange-500 text-xl">📝</span>
                    </div>
                    <p className="text-sm text-gray-500">
                      Bahan ini belum dipakai pada resep manapun.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}


          </form>
        </div>
      </Modal>
    )
  }
