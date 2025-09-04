'use client'

import { useState, useEffect, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Info } from 'lucide-react'
import { X, Plus, Trash2, Loader2, Calculator, ChefHat } from 'lucide-react'
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
  sku?: string
  name: string
  description?: string
  instructions?: string
  imageUrl?: string
  yield: number
  yieldUnitId?: string
  laborCost: number
  operationalCost: number
  packagingCost: number
  canBeUsedAsIngredient: boolean
  isFavorite?: boolean
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
  const formRef = useRef<HTMLFormElement>(null)
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    description: '',
    instructions: '',
    imageUrl: '',
    yield: '1',
    yieldUnitId: '',
    laborCost: '0',
    operationalCost: '0',
    packagingCost: '0',
    canBeUsedAsIngredient: false,
    isFavorite: false,
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
          sku: recipe.sku || '',
          name: recipe.name,
          description: recipe.description || '',
          instructions: recipe.instructions || '',
          imageUrl: recipe.imageUrl || '',
          yield: recipe.yield.toString(),
          yieldUnitId: recipe.yieldUnitId || '',
          laborCost: recipe.laborCost.toString(),
          operationalCost: recipe.operationalCost.toString(),
          packagingCost: recipe.packagingCost.toString(),
          canBeUsedAsIngredient: recipe.canBeUsedAsIngredient || false,
          isFavorite: recipe.isFavorite || false,
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
          sku: '',
          name: '',
          description: '',
          instructions: '',
          imageUrl: '',
          yield: '1',
          yieldUnitId: '',
          laborCost: '0',
          operationalCost: '0',
          packagingCost: '0',
          canBeUsedAsIngredient: false,
          isFavorite: false,
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
    const { name, value } = e.target
    
    // Handle numeric fields with proper decimal validation
    if (['yield', 'laborCost', 'operationalCost', 'packagingCost'].includes(name)) {
      if (value === '' || value === '0') {
        setFormData(prev => ({
          ...prev,
          [name]: name === 'yield' ? '1' : '0'
        }))
      } else {
        const parsed = parseFloat(value)
        if (!isNaN(parsed) && parsed >= 0) {
          setFormData(prev => ({
            ...prev,
            [name]: value
          }))
        }
      }
    } else {
      // Handle non-numeric fields normally
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
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
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={recipe ? 'Edit Resep' : 'Tambah Resep'} 
      size="xl"
      footer={
        <div className="space-y-4 w-full">
          {/* COGS Summary - Above Action Buttons */}
          <div 
            className="rounded-lg flex flex-row justify-between gap-2 p-4 border border-blue-200 bg-blue-50"
          >
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-blue-700" />
              <h3 className="text-lg font-medium text-blue-900">Ringkasan COGS</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-blue-700">Total COGS</p>
                <p className="text-xl font-semibold text-blue-900">
                  Rp {totalCOGS.toLocaleString('id-ID')}
                </p>
              </div>
              <div>
                <p className="text-sm text-blue-700">COGS per {units.find(u => u.id === formData.yieldUnitId)?.symbol || 'unit'}</p>
                <p className="text-xl font-semibold text-blue-900">
                  Rp {cogsPerServing.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              className="flex-1 h-10"
            >
              Batal
            </Button>
            <Button 
              type="button" 
              onClick={() => formRef.current?.requestSubmit()}
              disabled={loading}
              variant="accent"
              className="flex-1 h-10"
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
        </div>
      }
    >
      <div className="p-6 bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="px-4 py-3 rounded-lg text-sm border-2 border-red-200 bg-red-50 text-red-700 font-medium">
              ❌ {error}
            </div>
          )}

          {/* Header with Recipe Name and Favorite */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center">
                  <ChefHat className="h-5 w-5 text-white" />
                </div>
                <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                  {recipe ? 'Edit Resep' : 'Resep Baru'}
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-3">
                  <Switch
                    id="canBeUsedAsIngredient"
                    checked={formData.canBeUsedAsIngredient}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, canBeUsedAsIngredient: checked }))}
                  />
                  <div className="flex items-center gap-2">
                    <label htmlFor="canBeUsedAsIngredient" className="text-sm font-semibold text-gray-700 cursor-pointer">
                      Basic Recipe
                    </label>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <button type="button" className="text-gray-400 hover:text-gray-600 transition-colors">
                          <Info className="h-4 w-4" />
                        </button>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="text-sm font-semibold text-gray-900">Basic Recipe</h4>
                          <p className="text-sm text-gray-600">
                            Resep ini dapat digunakan sebagai bahan dalam resep lain. 
                            Ini berguna untuk resep dasar seperti saus, bumbu, atau komponen 
                            yang sering digunakan dalam berbagai hidangan.
                          </p>
                          <p className="text-xs text-gray-500">
                            Contoh: Saus tomat, bumbu dasar, atau kaldu dapat dijadikan Basic Recipe 
                            untuk digunakan dalam resep yang lebih kompleks.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    id="isFavorite"
                    checked={formData.isFavorite}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFavorite: checked }))}
                  />
                  <label htmlFor="isFavorite" className="text-sm font-medium text-gray-700 cursor-pointer">
                    ⭐ Favorit
                  </label>
                </div>
              </div>
            </div>

           
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold mb-2 text-gray-700">
                  Nama Resep *
                </label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Contoh: Nasi Goreng Spesial"
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg text-lg"
                />
              </div>

              <div>
                <label htmlFor="sku" className="block text-sm font-semibold mb-2 text-gray-700">
                  SKU
                </label>
                <Input
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  placeholder="RCP-001"
                  className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg font-mono"
                />
              </div>

              <div>
                <label htmlFor="categoryId" className="block text-sm font-semibold mb-2 text-gray-700">
                  Kategori
                </label>
                <Select
                  value={formData.categoryId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg">
                    <SelectValue placeholder="Pilih Kategori" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Gambar Resep
                </label>
                <div className="flex items-center gap-4">
                  <div className="w-20 h-20 rounded-lg overflow-hidden flex items-center justify-center border-2 border-gray-200 bg-gray-50">
                    {formData.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-xs text-gray-500">📷</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <Input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageChange} 
                      className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 rounded-lg" 
                    />
                    <div className="text-xs mt-1 text-gray-500">
                      {imageUploading ? 'Mengunggah...' : 'PNG/JPG/WEBP (opsional)'}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-semibold mb-2 text-gray-700">
                  Deskripsi
                </label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  rows={3}
                  placeholder="Deskripsi singkat resep..."
                />
              </div>

              <div>
                <label htmlFor="instructions" className="block text-sm font-semibold mb-2 text-gray-700">
                  Instruksi Memasak
                </label>
                <textarea
                  id="instructions"
                  name="instructions"
                  value={formData.instructions}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-lg border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200 resize-none"
                  rows={3}
                  placeholder="Langkah-langkah memasak..."
                />
              </div>
            </div>
          </div>


          {/* Ingredients Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-sm font-bold">🥘</span>
                </div>
                <h3 className="text-lg font-semibold bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">
                  Bahan-bahan
                </h3>
              </div>
              <Button 
                type="button" 
                onClick={addIngredient} 
                size="sm"
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Tambah Bahan
              </Button>
            </div>

            <div className="space-y-3">
              {recipeIngredients.map((recipeIng, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 p-4 rounded-lg border-2 border-gray-200 bg-gray-50 hover:bg-gray-100 transition-colors duration-200"
                >
                  <Select
                    value={recipeIng.ingredientId}
                    onValueChange={(value) => updateIngredient(index, 'ingredientId', value)}
                  >
                    <SelectTrigger 
                      className="flex-1 h-10 bg-white border-gray-300 text-gray-900"
                    >
                      <SelectValue placeholder="Pilih Bahan" />
                    </SelectTrigger>
                    <SelectContent className="bg-white border-gray-200">
                      <div className="p-2 border-b border-gray-200">
                        <Input
                          value={ingredientSearch[index] || ''}
                          onChange={(e) => setIngredientSearch(prev => ({ ...prev, [index]: e.target.value }))}
                          placeholder="Cari bahan..."
                          className="h-9 bg-gray-50 border-gray-300 text-gray-900"
                        />
                      </div>
                      {ingredientOptionsForIndex(index)
                        .filter(ing => (ingredientSearch[index] || '') === '' || ing.name.toLowerCase().includes((ingredientSearch[index] || '').toLowerCase()))
                        .map((ingredient) => (
                          <SelectItem 
                            key={ingredient.id} 
                            value={ingredient.id}
                            className="hover:bg-gray-100"
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
                    min="0.01"
                    value={recipeIng.quantity.toString()}
                    onChange={(e) => {
                      const value = e.target.value
                      if (value === '' || value === '0') {
                        updateIngredient(index, 'quantity', 0)
                      } else {
                        const parsed = parseFloat(value)
                        if (!isNaN(parsed) && parsed > 0) {
                          updateIngredient(index, 'quantity', parsed)
                        }
                      }
                    }}
                    placeholder="Jumlah"
                    className="w-24 h-10 bg-white border-gray-300 text-gray-900"
                  />

                  <div 
                    className="w-24 h-10 inline-flex items-center justify-center rounded-md border text-sm bg-gray-100 border-gray-300 text-gray-700"
                    title="Satuan mengikuti bahan yang dipilih"
                  >
                    {ingredients.find(ing => ing.id === recipeIng.ingredientId)?.usageUnit?.symbol || '—'}
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeIngredient(index)}
                    className="h-10"
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
                  <h4 className="text-md font-medium text-gray-900">Resep sebagai Bahan</h4>
                  <Button 
                    type="button" 
                    onClick={addSubRecipe} 
                    size="sm"
                    variant="success"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Tambah Resep
                  </Button>
                </div>

                <div className="space-y-3">
                  {subRecipes.map((subRec, index) => (
                    <div 
                      key={index} 
                      className="flex items-center gap-3 p-3 rounded-lg border border-green-200 bg-green-50"
                    >
                      <Select
                        value={subRec.subRecipeId}
                        onValueChange={(value) => updateSubRecipe(index, 'subRecipeId', value)}
                      >
                        <SelectTrigger 
                          className="flex-1 h-10 bg-white border-gray-300 text-gray-900"
                        >
                          <SelectValue placeholder="Pilih Resep" />
                        </SelectTrigger>
                        <SelectContent className="bg-white border-gray-200">
                          <div className="p-2 border-b border-gray-200">
                            <Input
                              value={subRecipeSearch[index] || ''}
                              onChange={(e) => setSubRecipeSearch(prev => ({ ...prev, [index]: e.target.value }))}
                              placeholder="Cari resep..."
                              className="h-9 bg-gray-50 border-gray-300 text-gray-900"
                            />
                          </div>
                          {subRecipeOptionsForIndex(index)
                            .filter(r => (subRecipeSearch[index] || '') === '' || r.name.toLowerCase().includes((subRecipeSearch[index] || '').toLowerCase()))
                            .map((recipe) => (
                              <SelectItem 
                                key={recipe.id} 
                                value={recipe.id}
                                className="text-gray-900 hover:bg-gray-100"
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
                        min="0.01"
                        value={subRec.quantity}
                        onChange={(e) => {
                          const value = e.target.value
                          if (value === '' || value === '0') {
                            updateSubRecipe(index, 'quantity', 0)
                          } else {
                            const parsed = parseFloat(value)
                            if (!isNaN(parsed) && parsed > 0) {
                              updateSubRecipe(index, 'quantity', parsed)
                            }
                          }
                        }}
                        placeholder="Jumlah"
                        className="w-24 h-10 bg-white border-gray-300 text-gray-900"
                      />

                      <div className="w-16 text-xs text-gray-600">
                        {availableRecipes.find(r => r.id === subRec.subRecipeId)?.yieldUnit?.symbol || ''}
                      </div>

                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => removeSubRecipe(index)}
                        className="h-10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Yield and Costs Section */}
          <div className="bg-white rounded-xl p-6 shadow-sm border border-blue-100">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Calculator className="h-4 w-4 text-white" />
              </div>
              <h3 className="text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Yield & Biaya
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label htmlFor="yield" className="block text-sm font-semibold mb-2 text-gray-700">
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
                  className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="yieldUnitId" className="block text-sm font-semibold mb-2 text-gray-700">
                  Satuan Hasil *
                </label>
                <Select
                  value={formData.yieldUnitId}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, yieldUnitId: value }))}
                >
                  <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 rounded-lg">
                    <SelectValue placeholder="Pilih Satuan" />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map((unit) => (
                      <SelectItem key={unit.id} value={unit.id}>
                        {unit.name} ({unit.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="laborCost" className="block text-sm font-semibold mb-2 text-gray-700">
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
                  className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="operationalCost" className="block text-sm font-semibold mb-2 text-gray-700">
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
                  className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="packagingCost" className="block text-sm font-semibold mb-2 text-gray-700">
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
                  className="h-12 border-2 border-gray-200 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          </form>
        </div>
      </Modal>
    )
  }
