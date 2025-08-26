'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Plus, Trash2, Loader2 } from 'lucide-react'
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
  const [formData, setFormData] = useState<Omit<IngredientFormData, 'id'>>({
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
    <Modal isOpen={isOpen} onClose={onClose} title={ingredient ? 'Edit Bahan Baku' : 'Tambah Bahan Baku'} size="lg">
      <div className="p-6" style={{ background: 'var(--color-panel-solid)' }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
              Nama Bahan Baku
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              className="h-10"
              style={{ 
                background: 'var(--gray-1)', 
                border: '1px solid var(--gray-7)', 
                color: 'var(--gray-12)'
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
              Deskripsi (opsional)
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full rounded-md px-3 py-2 text-sm"
              style={{
                background: 'var(--gray-1)',
                border: '1px solid var(--gray-7)',
                color: 'var(--gray-12)'
              }}
              placeholder="Contoh: Tepung terigu protein sedang"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
              Kategori
            </label>
            <Select
              value={formData.categoryId}
              onValueChange={(value) => setFormData({ ...formData, categoryId: value })}
              required
            >
              <SelectTrigger 
                className="h-10"
                style={{ 
                  background: 'var(--gray-1)', 
                  border: '1px solid var(--gray-7)', 
                  color: 'var(--gray-12)'
                }}
              >
                <SelectValue placeholder="Pilih Kategori" />
              </SelectTrigger>
              <SelectContent style={{ background: 'var(--gray-2)', border: '1px solid var(--gray-7)' }}>
                {categories.map((category) => (
                  <SelectItem 
                    key={category.id} 
                    value={category.id}
                    style={{ color: 'var(--gray-12)' }}
                    className="hover:bg-gray-3"
                  >
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
                Harga Beli
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.purchasePrice}
                onChange={(e) => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                required
                className="h-10"
                style={{ 
                  background: 'var(--gray-1)', 
                  border: '1px solid var(--gray-7)', 
                  color: 'var(--gray-12)'
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
                Jumlah Beli
              </label>
              <Input
                type="number"
                step="0.01"
                value={formData.purchaseQuantity}
                onChange={(e) => setFormData({ ...formData, purchaseQuantity: parseFloat(e.target.value) || 1 })}
                required
                className="h-10"
                style={{ 
                  background: 'var(--gray-1)', 
                  border: '1px solid var(--gray-7)', 
                  color: 'var(--gray-12)'
                }}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
              Satuan Beli
            </label>
            <Select
              value={formData.purchaseUnitId}
              onValueChange={(value) => setFormData({ ...formData, purchaseUnitId: value })}
              required
            >
              <SelectTrigger 
                className="h-10"
                style={{ 
                  background: 'var(--gray-1)', 
                  border: '1px solid var(--gray-7)', 
                  color: 'var(--gray-12)'
                }}
              >
                <SelectValue placeholder="Pilih Satuan" />
              </SelectTrigger>
              <SelectContent style={{ background: 'var(--gray-2)', border: '1px solid var(--gray-7)' }}>
                {units.map((unit) => (
                  <SelectItem 
                    key={unit.id} 
                    value={unit.id}
                    style={{ color: 'var(--gray-12)' }}
                    className="hover:bg-gray-3"
                  >
                    {unit.name} ({unit.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
              Satuan Pakai
            </label>
            <Select
              value={formData.usageUnitId}
              onValueChange={(value) => setFormData({ ...formData, usageUnitId: value })}
              required
            >
              <SelectTrigger 
                className="h-10"
                style={{ 
                  background: 'var(--gray-1)', 
                  border: '1px solid var(--gray-7)', 
                  color: 'var(--gray-12)'
                }}
              >
                <SelectValue placeholder="Pilih Satuan" />
              </SelectTrigger>
              <SelectContent style={{ background: 'var(--gray-2)', border: '1px solid var(--gray-7)' }}>
                {units.map((unit) => (
                  <SelectItem 
                    key={unit.id} 
                    value={unit.id}
                    style={{ color: 'var(--gray-12)' }}
                    className="hover:bg-gray-3"
                  >
                    {unit.name} ({unit.symbol})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
              Faktor Konversi
            </label>
            <Input
              type="number"
              step="0.01"
              value={formData.conversionFactor}
              onChange={(e) => setFormData({ ...formData, conversionFactor: parseFloat(e.target.value) || 1 })}
              required
              className="h-10"
              style={{ 
                background: 'var(--gray-1)', 
                border: '1px solid var(--gray-7)', 
                color: 'var(--gray-12)'
              }}
            />
            <p className="text-xs mt-2" style={{ color: 'var(--gray-11)' }}>
              Berapa satuan pakai dalam 1 satuan beli
            </p>
          </div>

          <div 
            className="p-4 rounded-md border"
            style={{ 
              background: 'var(--gray-2)', 
              border: '1px solid var(--gray-6)'
            }}
          >
            <p className="text-sm font-medium" style={{ color: 'var(--gray-12)' }}>
              Harga per {units.find(u => u.id === formData.usageUnitId)?.symbol || 'unit'}: 
              <span className="ml-2" style={{ color: 'var(--accent-11)', fontWeight: '600' }}>
                Rp {pricePerUnit.toLocaleString('id-ID')}
              </span>
            </p>
          </div>

          {ingredient?.id && (
            <div 
              className="p-4 rounded-md border"
              style={{ 
                background: 'var(--gray-2)', 
                border: '1px solid var(--gray-6)'
              }}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium" style={{ color: 'var(--gray-12)' }}>
                  Dipakai di Resep
                </p>
                <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--gray-4)', color: 'var(--gray-12)' }}>
                  {usageLoading ? 'Memuat...' : `${usageCount} resep`}
                </span>
              </div>
              {!usageLoading && usageRecipes.length > 0 && (
                <ul className="mt-3 space-y-2 max-h-40 overflow-auto pr-1">
                  {usageRecipes.map(r => (
                    <li key={r.id} className="flex items-center gap-2">
                      {r.imageUrl ? (
                        <img src={r.imageUrl} alt={r.name} className="w-6 h-6 rounded object-cover" />
                      ) : (
                        <div className="w-6 h-6 rounded bg-gray-300" />
                      )}
                      <span className="text-sm" style={{ color: 'var(--gray-12)' }}>{r.name}</span>
                    </li>
                  ))}
                </ul>
              )}
              {!usageLoading && usageRecipes.length === 0 && (
                <p className="text-xs mt-2" style={{ color: 'var(--gray-11)' }}>
                  Bahan ini belum dipakai pada resep manapun.
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose} 
              className="flex-1 h-10" 
              disabled={loading}
              style={{
                background: 'var(--gray-2)',
                border: '1px solid var(--gray-7)',
                color: 'var(--gray-11)'
              }}
            >
              Batal
            </Button>
            <Button 
              type="submit" 
              disabled={loading} 
              className="flex-1 h-10"
              style={{
                background: 'var(--accent-9)',
                color: 'white',
                border: 'none'
              }}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </div>
          </form>
        </div>
      </Modal>
    )
  }
