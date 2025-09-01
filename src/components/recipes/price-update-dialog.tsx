'use client'

import { useState, useEffect } from 'react'
import { Modal } from '@/components/ui/modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { TextareaField } from '@/components/forms/TextareaField'
import { Badge } from '@/components/ui/badge'
import { Calculator, TrendingUp, TrendingDown, DollarSign } from 'lucide-react'
import { useDecimalSettings } from '@/hooks/useDecimalSettings'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface Recipe {
  id: string
  name: string
  sku?: string
  cogsPerServing: number
  basePrice: number
  sellingPrice: number
  profitMargin: number
  marginType: string
}

interface PriceUpdateDialogProps {
  isOpen: boolean
  onClose: () => void
  recipe: Recipe
  onPriceUpdated: () => void
}

export function PriceUpdateDialog({
  isOpen,
  onClose,
  recipe,
  onPriceUpdated
}: PriceUpdateDialogProps) {
  const { settings: decimalSettings } = useDecimalSettings()
  const [loading, setLoading] = useState(false)
  const [newPrice, setNewPrice] = useState(recipe.sellingPrice || 0)
  const [reason, setReason] = useState('')
  const [updateMethod, setUpdateMethod] = useState<'manual' | 'markup' | 'profit'>('manual')
  const [markupPercentage, setMarkupPercentage] = useState(30)
  const [targetProfitMargin, setTargetProfitMargin] = useState(30)

  // Update newPrice when recipe changes
  useEffect(() => {
    console.log('Recipe data in dialog:', recipe)
    if (typeof recipe?.sellingPrice === 'number') {
      setNewPrice(recipe.sellingPrice)
    } else {
      console.warn('Recipe sellingPrice is not a number:', recipe?.sellingPrice)
      setNewPrice(0)
    }
  }, [recipe])

  const currentProfitMargin = recipe?.sellingPrice && recipe?.cogsPerServing ? 
    ((recipe.sellingPrice - recipe.cogsPerServing) / recipe.sellingPrice * 100) : 0
  const newProfitMargin = newPrice && recipe?.cogsPerServing ? 
    ((newPrice - recipe.cogsPerServing) / newPrice * 100) : 0
  const priceChange = newPrice && recipe?.sellingPrice ? (newPrice - recipe.sellingPrice) : 0
  const percentageChange = recipe?.sellingPrice && recipe.sellingPrice > 0 ? (priceChange / recipe.sellingPrice) * 100 : 0

  const calculatePriceByMarkup = () => {
    if (!recipe?.cogsPerServing) return
    const markup = markupPercentage / 100
    const calculatedPrice = recipe.cogsPerServing * (1 + markup)
    setNewPrice(Math.round(calculatedPrice))
  }

  const calculatePriceByProfit = () => {
    if (!recipe?.cogsPerServing) return
    const targetMargin = targetProfitMargin / 100
    const calculatedPrice = recipe.cogsPerServing / (1 - targetMargin)
    setNewPrice(Math.round(calculatedPrice))
  }

  const handleSubmit = async () => {
    if (newPrice <= 0) {
      toast.error('Harga harus lebih dari 0')
      return
    }

    if (typeof recipe?.sellingPrice !== 'number') {
      toast.error('Data resep tidak valid - harga jual tidak ditemukan')
      return
    }
    
    if (newPrice === recipe.sellingPrice) {
      toast.error('Harga baru harus berbeda dari harga saat ini')
      return
    }

    try {
      setLoading(true)
      const requestBody = {
        newPrice,
        reason: reason || 'Manual price update'
      }
      console.log('Sending price update request:', requestBody)
      
      const response = await fetch(`/api/recipes/${recipe.id}/price`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Price update successful:', result)
        onPriceUpdated()
        toast.success('Harga berhasil diperbarui')
      } else {
        const error = await response.json()
        console.error('Price update failed:', error)
        toast.error(error.error || 'Gagal memperbarui harga')
      }
    } catch (error) {
      console.error('Error updating price:', error)
      toast.error('Terjadi kesalahan saat memperbarui harga')
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (recipe?.sellingPrice) {
      setNewPrice(recipe.sellingPrice)
    }
    setReason('')
    setUpdateMethod('manual')
    setMarkupPercentage(30)
    setTargetProfitMargin(30)
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Update Recipe Price"
      size="2xl"
    >

        <div className="space-y-6">
          {/* Recipe Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{recipe?.name || 'Recipe'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Current Price</p>
                  <p className="text-xl font-bold text-blue-600">
                    {recipe?.sellingPrice ? (decimalSettings ? formatCurrency(recipe.sellingPrice, decimalSettings) : `Rp ${recipe.sellingPrice.toLocaleString('id-ID')}`) : 'Rp 0'}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">COGS per Unit</p>
                  <p className="text-xl font-bold text-gray-700">
                    {recipe?.cogsPerServing ? (decimalSettings ? formatCurrency(recipe.cogsPerServing, decimalSettings) : `Rp ${recipe.cogsPerServing.toLocaleString('id-ID')}`) : 'Rp 0'}
                  </p>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500 mb-1">Current Margin</p>
                  <p className="text-xl font-bold text-green-600">
                    {currentProfitMargin.toFixed(1)}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Update Method Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Update Method</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant={updateMethod === 'manual' ? 'default' : 'outline'}
                    onClick={() => setUpdateMethod('manual')}
                    className="h-auto p-3 flex-col gap-2"
                  >
                    <DollarSign className="h-5 w-5" />
                    <span className="text-sm">Manual Price</span>
                  </Button>
                  <Button
                    variant={updateMethod === 'markup' ? 'default' : 'outline'}
                    onClick={() => setUpdateMethod('markup')}
                    className="h-auto p-3 flex-col gap-2"
                  >
                    <Calculator className="h-5 w-5" />
                    <span className="text-sm">Markup %</span>
                  </Button>
                  <Button
                    variant={updateMethod === 'profit' ? 'default' : 'outline'}
                    onClick={() => setUpdateMethod('profit')}
                    className="h-auto p-3 flex-col gap-2"
                  >
                    <TrendingUp className="h-5 w-5" />
                    <span className="text-sm">Target Margin</span>
                  </Button>
                </div>

                {/* Markup Method */}
                {updateMethod === 'markup' && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={markupPercentage}
                        onChange={(e) => setMarkupPercentage(Number(e.target.value))}
                        placeholder="Markup percentage"
                        className="w-32"
                      />
                      <span className="text-sm text-gray-600">% markup dari COGS</span>
                      <Button onClick={calculatePriceByMarkup} size="sm">
                        Calculate
                      </Button>
                    </div>
                  </div>
                )}

                {/* Profit Margin Method */}
                {updateMethod === 'profit' && (
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Input
                        type="number"
                        value={targetProfitMargin}
                        onChange={(e) => setTargetProfitMargin(Number(e.target.value))}
                        placeholder="Target profit margin"
                        className="w-32"
                      />
                      <span className="text-sm text-gray-600">% target margin</span>
                      <Button onClick={calculatePriceByProfit} size="sm">
                        Calculate
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* New Price Input */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">New Price</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Harga Baru (Rp)
                  </label>
                  <Input
                    type="number"
                    value={newPrice}
                    onChange={(e) => setNewPrice(Number(e.target.value))}
                    placeholder="Masukkan harga baru"
                    className="text-lg font-semibold"
                  />
                </div>

                {/* Price Change Preview */}
                {newPrice !== recipe.sellingPrice && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Perubahan Harga</p>
                        <p className={`font-semibold text-lg ${priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {priceChange >= 0 ? '+' : ''}
                          {decimalSettings ? formatCurrency(priceChange, decimalSettings) : `Rp ${priceChange.toLocaleString('id-ID')}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Perubahan %</p>
                        <p className={`font-semibold text-lg ${percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {percentageChange >= 0 ? '+' : ''}
                          {percentageChange.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-1">Margin Baru</p>
                        <p className="font-semibold text-lg text-green-600">
                          {newProfitMargin.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Reason for Update */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Reason for Update</CardTitle>
            </CardHeader>
            <CardContent>
              <TextareaField
                label="Alasan perubahan harga (opsional)"
                value={reason}
                onChange={setReason}
                placeholder="Contoh: Penyesuaian dengan biaya bahan baku, perubahan strategi pricing, dll."
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={handleReset}>
              Reset
            </Button>
            <Button onClick={handleSubmit} disabled={loading}>
              {loading ? 'Updating...' : 'Update Price'}
            </Button>
          </div>
        </div>
      </Modal>
    )
}
