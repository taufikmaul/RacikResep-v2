'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { X, Plus, Trash2, Loader2, Calculator } from 'lucide-react'
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
  type: string
}

interface Ingredient {
  id: string
  name: string
  costPerUnit: number
  usageUnit: {
    id: string
    name: string
    symbol: string
  }
}

interface RecipeAsIngredient {
  id: string
  name: string
  costPerUnit: number
  yieldUnit: {
    id: string
    name: string
    symbol: string
  }
}

interface RecipeIngredient {
  ingredientId: string
  quantity: number
  unitId: string
  cost?: number
}

interface Recipe {
  id: string
  name: string
  description?: string
  instructions?: string
  imageUrl?: string
  yield: number
  yieldUnitId?: string
  laborCost: number
  operationalCost: number
  packagingCost: number
  profitMargin: number
  marginType: string
  sellingPrice: number
  canBeUsedAsIngredient: boolean
  categoryId?: string
  ingredients: Array<{
    ingredientId: string
    quantity: number
    unitId: string
  }>
  subRecipes: Array<{
    subRecipeId: string
    quantity: number
  }>
}

interface RecipeDialogProps {
  isOpen: boolean
  onClose: () => void
  onSave: (recipeData: any) => Promise<void>
  recipe?: Recipe | null
}

export function RecipeDialog({ isOpen, onClose, onSave, recipe }: RecipeDialogProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    instructions: '',
    imageUrl: '',
    yield: '1',
    yieldUnitId: '',
    laborCost: '0',
    operationalCost: '0',
    packagingCost: '0',
    profitMargin: '0',
    marginType: 'percentage',
    canBeUsedAsIngredient: false,
    categoryId: ''
  })
  const [recipeIngredients, setRecipeIngredients] = useState<RecipeIngredient[]>([])
  const [subRecipes, setSubRecipes] = useState<Array<{subRecipeId: string, quantity: number}>>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [ingredients, setIngredients] = useState<Ingredient[]>([])
  const [availableRecipes, setAvailableRecipes] = useState<RecipeAsIngredient[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [sellingPrice, setSellingPrice] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [totalCOGS, setTotalCOGS] = useState(0)
  const [cogsPerServing, setCogsPerServing] = useState(0)
  const [imageUploading, setImageUploading] = useState(false)
  const [ingredientSearch, setIngredientSearch] = useState<Record<number, string>>({})
  const [subRecipeSearch, setSubRecipeSearch] = useState<Record<number, string>>({})

  useEffect(() => {
    if (isOpen) {
      fetchCategories()
      fetchIngredients()
      fetchAvailableRecipes()
      fetchUnits()
      
      if (recipe) {
        setFormData({
          name: recipe.name,
          description: recipe.description || '',
          instructions: recipe.instructions || '',
          imageUrl: recipe.imageUrl || '',
          yield: recipe.yield.toString(),
          yieldUnitId: recipe.yieldUnitId || '',
          laborCost: recipe.laborCost.toString(),
          operationalCost: recipe.operationalCost.toString(),
          packagingCost: recipe.packagingCost.toString(),
          profitMargin: recipe.profitMargin.toString(),
          marginType: recipe.marginType || 'percentage',
          canBeUsedAsIngredient: recipe.canBeUsedAsIngredient || false,
          categoryId: recipe.categoryId || ''
        })
        setRecipeIngredients(recipe.ingredients.map(ing => ({
          ingredientId: ing.ingredientId,
          quantity: ing.quantity,
          unitId: ing.unitId
        })))
        setSubRecipes(recipe.subRecipes || [])
      } else {
        setFormData({
          name: '',
          description: '',
          instructions: '',
          imageUrl: '',
          yield: '1',
          yieldUnitId: '',
          laborCost: '0',
          operationalCost: '0',
          packagingCost: '0',
          profitMargin: '0',
          marginType: 'percentage',
          canBeUsedAsIngredient: false,
          categoryId: ''
        })
        setRecipeIngredients([])
        setSubRecipes([])
      }
    }
  }, [isOpen, recipe])

  useEffect(() => {
    calculateCOGS()
  }, [recipeIngredients, subRecipes, formData.laborCost, formData.operationalCost, formData.packagingCost, formData.yield, ingredients, availableRecipes])

  useEffect(() => {
    calculateSellingPrice()
  }, [totalCOGS, formData.profitMargin, formData.marginType, formData.yield])

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories?type=recipe')
      if (response.ok) {
        const data = await response.json()
        setCategories(data)
      }
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  const fetchIngredients = async () => {
    try {
      const response = await fetch('/api/ingredients?limit=1000')
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result
        setIngredients(data.map((ing: any) => ({
          id: ing.id,
          name: ing.name,
          costPerUnit: ing.costPerUnit,
          usageUnit: ing.usageUnit
        })))
      }
    } catch (error) {
      console.error('Error fetching ingredients:', error)
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
    }
  }

  const fetchAvailableRecipes = async () => {
    try {
      const response = await fetch('/api/recipes?canBeUsedAsIngredient=true&limit=1000')
      if (response.ok) {
        const result = await response.json()
        const data = result.data || result
        setAvailableRecipes(data.filter((r: any) => r.id !== recipe?.id).map((r: any) => ({
          id: r.id,
          name: r.name,
          costPerUnit: r.costPerUnit,
          yieldUnit: r.yieldUnit
        })))
      }
    } catch (error) {
      console.error('Error fetching available recipes:', error)
    }
  }

  const calculateCOGS = () => {
    let ingredientsCost = 0
    let subRecipesCost = 0
    
    recipeIngredients.forEach(recipeIng => {
      const ingredient = ingredients.find(ing => ing.id === recipeIng.ingredientId)
      if (ingredient) {
        ingredientsCost += ingredient.costPerUnit * recipeIng.quantity
      }
    })

    subRecipes.forEach(subRec => {
      const recipe = availableRecipes.find(r => r.id === subRec.subRecipeId)
      if (recipe) {
        subRecipesCost += recipe.costPerUnit * subRec.quantity
      }
    })

    const laborCost = parseFloat(formData.laborCost) || 0
    const operationalCost = parseFloat(formData.operationalCost) || 0
    const packagingCost = parseFloat(formData.packagingCost) || 0
    const yieldAmount = parseFloat(formData.yield) || 1

    const total = ingredientsCost + subRecipesCost + laborCost + operationalCost + packagingCost
    const perServing = total / yieldAmount

    setTotalCOGS(total)
    setCogsPerServing(perServing)
  }

  const calculateSellingPrice = () => {
    const margin = parseFloat(formData.profitMargin) || 0
    const yieldAmount = parseFloat(formData.yield) || 1
    const cogsPerUnit = totalCOGS / yieldAmount

    let price = 0
    if (formData.marginType === 'percentage') {
      // Standard gross margin on price basis
      const marginFraction = Math.min(Math.max(margin / 100, 0), 0.99)
      price = cogsPerUnit / (1 - marginFraction)
    } else {
      // Amount (nominal) margin: simple additive
      price = cogsPerUnit + margin
    }

    setSellingPrice(price)
  }

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('Format gambar tidak didukung')
      return
    }
    try {
      setImageUploading(true)
      const form = new FormData()
      form.append('file', file)
      const res = await fetch('/api/uploads', { method: 'POST', body: form })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Gagal mengunggah gambar')
      }
      const data = await res.json()
      setFormData(prev => ({ ...prev, imageUrl: data.url || '' }))
      toast.success('Gambar berhasil diunggah')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal mengunggah gambar'
      toast.error(msg)
    } finally {
      setImageUploading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const addIngredient = () => {
    setRecipeIngredients(prev => [...prev, {
      ingredientId: '',
      quantity: 0,
      unitId: ''
    }])
  }

  const updateIngredient = (index: number, field: keyof RecipeIngredient, value: string | number) => {
    setRecipeIngredients(prev => prev.map((ing, i) => {
      if (i !== index) return ing
      // When ingredient changes, auto-set unitId to the ingredient's usageUnit
      if (field === 'ingredientId' && typeof value === 'string') {
        const selected = ingredients.find((x) => x.id === value)
        return {
          ...ing,
          ingredientId: value,
          unitId: selected?.usageUnit?.id || ''
        }
      }
      return { ...ing, [field]: value }
    }))
  }

  const removeIngredient = (index: number) => {
    setRecipeIngredients(prev => prev.filter((_, i) => i !== index))
  }

  const addSubRecipe = () => {
    setSubRecipes(prev => [...prev, {
      subRecipeId: '',
      quantity: 0
    }])
  }

  const updateSubRecipe = (index: number, field: 'subRecipeId' | 'quantity', value: string | number) => {
    setSubRecipes(prev => prev.map((sub, i) => 
      i === index ? { ...sub, [field]: value } : sub
    ))
  }

  const removeSubRecipe = (index: number) => {
    setSubRecipes(prev => prev.filter((_, i) => i !== index))
  }

  // Per-row ingredient options: include current selection, exclude duplicates from other rows
  const ingredientOptionsForIndex = (rowIndex: number) =>
    ingredients.filter((ingredient) =>
      recipeIngredients[rowIndex]?.ingredientId === ingredient.id ||
      !recipeIngredients.some((ri, i) => i !== rowIndex && ri.ingredientId === ingredient.id)
    )

  // Per-row sub-recipe options: include current selection, exclude duplicates from other rows
  const subRecipeOptionsForIndex = (rowIndex: number) =>
    availableRecipes.filter((rec) =>
      subRecipes[rowIndex]?.subRecipeId === rec.id ||
      !subRecipes.some((sr, i) => i !== rowIndex && sr.subRecipeId === rec.id)
    )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    
    try {
      // Safe numeric parsing with fallbacks
      const parsedYield = Number.isFinite(parseFloat(formData.yield)) && parseFloat(formData.yield) > 0
        ? parseFloat(formData.yield)
        : 1
      const parsedLabor = Number.isFinite(parseFloat(formData.laborCost)) ? parseFloat(formData.laborCost) : 0
      const parsedOperational = Number.isFinite(parseFloat(formData.operationalCost)) ? parseFloat(formData.operationalCost) : 0
      const parsedPackaging = Number.isFinite(parseFloat(formData.packagingCost)) ? parseFloat(formData.packagingCost) : 0
      const parsedMargin = Number.isFinite(parseFloat(formData.profitMargin)) ? parseFloat(formData.profitMargin) : 0

      // Client-side validations to prevent 4xx/5xx
      if (!formData.name.trim()) {
        throw new Error('Nama resep wajib diisi')
      }
      if (!formData.yieldUnitId) {
        throw new Error('Satuan hasil wajib dipilih')
      }
      const cleanedIngredients = recipeIngredients
        .filter(ing => ing.ingredientId && ing.unitId)
        .map(ing => ({
          ingredientId: ing.ingredientId,
          unitId: ing.unitId,
          quantity: typeof ing.quantity === 'number' && isFinite(ing.quantity) ? ing.quantity : 0
        }))
        .filter(ing => ing.quantity > 0)

      const cleanedSubRecipes = subRecipes
        .filter(sr => sr.subRecipeId)
        .map(sr => ({
          subRecipeId: sr.subRecipeId,
          quantity: typeof sr.quantity === 'number' && isFinite(sr.quantity) ? sr.quantity : 0
        }))
        .filter(sr => sr.quantity > 0)

      if (cleanedIngredients.length === 0 && cleanedSubRecipes.length === 0) {
        throw new Error('Tambahkan minimal satu bahan atau satu resep sebagai bahan')
      }

      const recipeData = {
        ...formData,
        yield: parsedYield,
        laborCost: parsedLabor,
        operationalCost: parsedOperational,
        packagingCost: parsedPackaging,
        profitMargin: parsedMargin,
        sellingPrice: sellingPrice,
        ingredients: cleanedIngredients,
        subRecipes: cleanedSubRecipes
      }
      
      await onSave(recipeData)
      toast.success(recipe ? 'Resep berhasil diperbarui' : 'Resep berhasil ditambahkan')
      onClose()
    } catch (error) {
      console.error('Error saving recipe:', error)
      const message = error instanceof Error ? error.message : 'Gagal menyimpan resep'
      toast.error(message)
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={recipe ? 'Edit Resep' : 'Tambah Resep'} size="2xl">
      <div className="p-6" style={{ background: 'var(--color-panel-solid)' }}>
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div 
              className="px-4 py-3 rounded-md text-sm border"
              style={{
                background: 'var(--red-2)',
                border: '1px solid var(--red-7)',
                color: 'var(--red-11)'
              }}
            >
              {error}
            </div>
          )}

            {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
                Nama Resep
              </label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                placeholder="Contoh: Nasi Goreng Spesial"
                className="h-10"
                style={{ 
                  background: 'var(--gray-1)', 
                  border: '1px solid var(--gray-7)', 
                  color: 'var(--gray-12)'
                }}
              />
            </div>

            <div>
              <label htmlFor="categoryId" className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
                Kategori
              </label>
              <Select
                value={formData.categoryId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
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
          </div>

          {/* Image Upload */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
                Gambar Resep (opsional)
              </label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-md overflow-hidden flex items-center justify-center border" style={{ borderColor: 'var(--gray-7)', background: 'var(--gray-2)' }}>
                  {formData.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="text-xs" style={{ color: 'var(--gray-11)' }}>Tidak ada gambar</div>
                  )}
                </div>
                <div>
                  <Input type="file" accept="image/*" onChange={handleImageChange} className="h-10" />
                  <div className="text-xs mt-1" style={{ color: 'var(--gray-11)' }}>
                    {imageUploading ? 'Mengunggah...' : 'PNG/JPG/WEBP'}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
              Deskripsi
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2"
              style={{
                background: 'var(--gray-1)',
                border: '1px solid var(--gray-7)',
                color: 'var(--gray-12)'
              }}
              rows={2}
              placeholder="Deskripsi resep"
            />
          </div>

          <div>
            <label htmlFor="instructions" className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
              Instruksi Memasak
            </label>
            <textarea
              id="instructions"
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              className="w-full px-3 py-2 rounded-md text-sm focus:outline-none focus:ring-2"
              style={{
                background: 'var(--gray-1)',
                border: '1px solid var(--gray-7)',
                color: 'var(--gray-12)'
              }}
              rows={4}
              placeholder="Langkah-langkah memasak..."
            />
          </div>

            {/* Yield and Costs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label htmlFor="yield" className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
                Jumlah Hasil *
              </label>
              <Input
                id="yield"
                name="yield"
                type="number"
                step="0.01"
                min="0.01"
                value={formData.yield}
                onChange={handleChange}
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
              <label htmlFor="yieldUnitId" className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
                Satuan Hasil *
              </label>
              <Select
                value={formData.yieldUnitId}
                onValueChange={(value) => setFormData(prev => ({ ...prev, yieldUnitId: value }))}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

            <div>
              <label htmlFor="laborCost" className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
                Biaya Tenaga Kerja
              </label>
              <Input
                id="laborCost"
                name="laborCost"
                type="number"
                step="0.01"
                value={formData.laborCost}
                onChange={handleChange}
                placeholder="0"
                className="h-10"
                style={{ 
                  background: 'var(--gray-1)', 
                  border: '1px solid var(--gray-7)', 
                  color: 'var(--gray-12)'
                }}
              />
            </div>

            <div>
              <label htmlFor="operationalCost" className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
                Biaya Operasional
              </label>
              <Input
                id="operationalCost"
                name="operationalCost"
                type="number"
                step="0.01"
                value={formData.operationalCost}
                onChange={handleChange}
                placeholder="0"
                className="h-10"
                style={{ 
                  background: 'var(--gray-1)', 
                  border: '1px solid var(--gray-7)', 
                  color: 'var(--gray-12)'
                }}
              />
            </div>

            <div>
              <label htmlFor="packagingCost" className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
                Biaya Kemasan
              </label>
              <Input
                id="packagingCost"
                name="packagingCost"
                type="number"
                step="0.01"
                value={formData.packagingCost}
                onChange={handleChange}
                placeholder="0"
                className="h-10"
                style={{ 
                  background: 'var(--gray-1)', 
                  border: '1px solid var(--gray-7)', 
                  color: 'var(--gray-12)'
                }}
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
                Jenis Margin
              </label>
              <Select
                value={formData.marginType}
                onValueChange={(value) => setFormData(prev => ({ ...prev, marginType: value }))}
              >
                <SelectTrigger 
                  className="h-10"
                  style={{ 
                    background: 'var(--gray-1)', 
                    border: '1px solid var(--gray-7)', 
                    color: 'var(--gray-12)'
                  }}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent style={{ background: 'var(--gray-2)', border: '1px solid var(--gray-7)' }}>
                  <SelectItem value="percentage" style={{ color: 'var(--gray-12)' }}>Persentase (%)</SelectItem>
                  <SelectItem value="amount" style={{ color: 'var(--gray-12)' }}>Nominal (Rp)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label htmlFor="profitMargin" className="block text-sm font-medium mb-2" style={{ color: 'var(--gray-12)' }}>
                Margin {formData.marginType === 'percentage' ? '(%)' : '(Rp)'}
              </label>
              <Input
                id="profitMargin"
                name="profitMargin"
                type="number"
                step="0.01"
                value={formData.profitMargin}
                onChange={handleChange}
                placeholder="0"
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
                Harga Jual per {units.find(u => u.id === formData.yieldUnitId)?.symbol || 'unit'}
              </label>
              <div 
                className="h-10 px-3 py-2 rounded-md border flex items-center"
                style={{ 
                  background: 'var(--gray-2)', 
                  border: '1px solid var(--gray-6)', 
                  color: 'var(--gray-12)'
                }}
              >
                Rp {sellingPrice.toLocaleString('id-ID')}
              </div>
            </div>
          </div>

          {/* Recipe Usage Flag */}
          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="canBeUsedAsIngredient"
              checked={formData.canBeUsedAsIngredient}
              onChange={(e) => setFormData(prev => ({ ...prev, canBeUsedAsIngredient: e.target.checked }))}
              className="w-4 h-4 rounded"
              style={{ accentColor: 'var(--accent-9)' }}
            />
            <label htmlFor="canBeUsedAsIngredient" className="text-sm font-medium" style={{ color: 'var(--gray-12)' }}>
              Resep ini dapat digunakan sebagai bahan dalam resep lain
            </label>
          </div>

            {/* Ingredients */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium" style={{ color: 'var(--gray-12)' }}>Bahan-bahan</h3>
              <Button 
                type="button" 
                onClick={addIngredient} 
                size="sm"
                style={{
                  background: 'var(--accent-9)',
                  color: 'white',
                  border: 'none'
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Bahan
              </Button>
            </div>

            <div className="space-y-3">
              {recipeIngredients.map((recipeIng, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 p-3 rounded-lg border"
                  style={{
                    background: 'var(--gray-2)',
                    border: '1px solid var(--gray-6)'
                  }}
                >
                  <Select
                    value={recipeIng.ingredientId}
                    onValueChange={(value) => updateIngredient(index, 'ingredientId', value)}
                  >
                    <SelectTrigger 
                      className="flex-1 h-10"
                      style={{ 
                        background: 'var(--gray-1)', 
                        border: '1px solid var(--gray-7)', 
                        color: 'var(--gray-12)'
                      }}
                    >
                      <SelectValue placeholder="Pilih Bahan" />
                    </SelectTrigger>
                    <SelectContent style={{ background: 'var(--gray-2)', border: '1px solid var(--gray-7)' }}>
                      <div className="p-2 border-b" style={{ borderColor: 'var(--gray-6)' }}>
                        <Input
                          value={ingredientSearch[index] || ''}
                          onChange={(e) => setIngredientSearch(prev => ({ ...prev, [index]: e.target.value }))}
                          placeholder="Cari bahan..."
                          className="h-9"
                          style={{ background: 'var(--gray-1)', border: '1px solid var(--gray-6)', color: 'var(--gray-12)' }}
                        />
                      </div>
                      {ingredientOptionsForIndex(index)
                        .filter(ing => (ingredientSearch[index] || '') === '' || ing.name.toLowerCase().includes((ingredientSearch[index] || '').toLowerCase()))
                        .map((ingredient) => (
                          <SelectItem 
                            key={ingredient.id} 
                            value={ingredient.id}
                            style={{ color: 'var(--gray-12)' }}
                            className="hover:bg-gray-3"
                          >
                            <div className="flex flex-col">
                              <span className="font-medium">{ingredient.name}</span>
                              <span className="text-xs text-gray-500">Rp {ingredient.costPerUnit.toLocaleString('id-ID')} / {ingredient.usageUnit?.symbol}</span>
                            </div>
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>

                  <Input
                    type="number"
                    step="0.01"
                    value={recipeIng.quantity}
                    onChange={(e) => updateIngredient(index, 'quantity', parseFloat(e.target.value) || 0)}
                    placeholder="Jumlah"
                    className="w-24 h-10"
                    style={{ 
                      background: 'var(--gray-1)', 
                      border: '1px solid var(--gray-7)', 
                      color: 'var(--gray-12)'
                    }}
                  />

                  <div 
                    className="w-24 h-10 inline-flex items-center justify-center rounded-md border text-sm"
                    style={{ 
                      background: 'var(--gray-2)', 
                      border: '1px solid var(--gray-6)', 
                      color: 'var(--gray-11)'
                    }}
                    title="Satuan mengikuti bahan yang dipilih"
                  >
                    {ingredients.find(ing => ing.id === recipeIng.ingredientId)?.usageUnit?.symbol || '—'}
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                    className="h-10"
                    style={{
                      background: 'var(--red-2)',
                      border: '1px solid var(--red-7)',
                      color: 'var(--red-11)'
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>

            {/* Sub-recipes */}
            {availableRecipes.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-md font-medium" style={{ color: 'var(--gray-12)' }}>Resep sebagai Bahan</h4>
                  <Button 
                    type="button" 
                    onClick={addSubRecipe} 
                    size="sm"
                    style={{
                      background: 'var(--green-9)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Resep
                  </Button>
                </div>

                <div className="space-y-3">
                  {subRecipes.map((subRec, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-3 rounded-lg border"
                      style={{
                        background: 'var(--green-2)',
                        border: '1px solid var(--green-6)'
                      }}
                    >
                      <Select
                        value={subRec.subRecipeId}
                        onValueChange={(value) => updateSubRecipe(index, 'subRecipeId', value)}
                      >
                        <SelectTrigger 
                          className="flex-1 h-10"
                          style={{ 
                            background: 'var(--gray-1)', 
                            border: '1px solid var(--gray-7)', 
                            color: 'var(--gray-12)'
                          }}
                        >
                          <SelectValue placeholder="Pilih Resep" />
                        </SelectTrigger>
                        <SelectContent style={{ background: 'var(--gray-2)', border: '1px solid var(--gray-7)' }}>
                          <div className="p-2 border-b" style={{ borderColor: 'var(--gray-6)' }}>
                            <Input
                              value={subRecipeSearch[index] || ''}
                              onChange={(e) => setSubRecipeSearch(prev => ({ ...prev, [index]: e.target.value }))}
                              placeholder="Cari resep..."
                              className="h-9"
                              style={{ background: 'var(--gray-1)', border: '1px solid var(--gray-6)', color: 'var(--gray-12)' }}
                            />
                          </div>
                          {subRecipeOptionsForIndex(index)
                            .filter(r => (subRecipeSearch[index] || '') === '' || r.name.toLowerCase().includes((subRecipeSearch[index] || '').toLowerCase()))
                            .map((recipe) => (
                              <SelectItem 
                                key={recipe.id} 
                                value={recipe.id}
                                style={{ color: 'var(--gray-12)' }}
                                className="hover:bg-gray-3"
                              >
                                <div className="flex flex-col">
                                  <span className="font-medium">{recipe.name}</span>
                                  <span className="text-xs text-gray-500">Rp {recipe.costPerUnit.toLocaleString('id-ID')} / {recipe.yieldUnit?.symbol}</span>
                                </div>
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>

                      <Input
                        type="number"
                        step="0.01"
                        value={subRec.quantity}
                        onChange={(e) => updateSubRecipe(index, 'quantity', parseFloat(e.target.value) || 0)}
                        placeholder="Jumlah"
                        className="w-24 h-10"
                        style={{ 
                          background: 'var(--gray-1)', 
                          border: '1px solid var(--gray-7)', 
                          color: 'var(--gray-12)'
                        }}
                      />

                      <div className="w-16 text-xs" style={{ color: 'var(--gray-11)' }}>
                        {availableRecipes.find(r => r.id === subRec.subRecipeId)?.yieldUnit?.symbol || ''}
                      </div>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeSubRecipe(index)}
                        className="h-10"
                        style={{
                          background: 'var(--red-2)',
                          border: '1px solid var(--red-7)',
                          color: 'var(--red-11)'
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>

            {/* COGS Summary */}
          <div 
            className="rounded-lg p-4 border"
            style={{
              background: 'var(--blue-2)',
              border: '1px solid var(--blue-6)'
            }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-5 w-5" style={{ color: 'var(--blue-11)' }} />
              <h3 className="text-lg font-medium" style={{ color: 'var(--blue-12)' }}>Ringkasan COGS</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm" style={{ color: 'var(--blue-11)' }}>Total COGS</p>
                <p className="text-xl font-semibold" style={{ color: 'var(--blue-12)' }}>
                  Rp {totalCOGS.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--blue-11)' }}>COGS per {units.find(u => u.id === formData.yieldUnitId)?.symbol || 'unit'}</p>
                <p className="text-xl font-semibold" style={{ color: 'var(--blue-12)' }}>
                  Rp {cogsPerServing.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-sm" style={{ color: 'var(--blue-11)' }}>Harga Jual per {units.find(u => u.id === formData.yieldUnitId)?.symbol || 'unit'}</p>
                <p className="text-xl font-semibold" style={{ color: 'var(--blue-12)' }}>
                  Rp {sellingPrice.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="h-10"
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
              className="h-10"
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
                recipe ? 'Perbarui' : 'Simpan'
              )}
            </Button>
          </div>
          </form>
        </div>
      </Modal>
    )
  }
