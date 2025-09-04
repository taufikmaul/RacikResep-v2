'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Modal } from '@/components/ui/modal'
import { Loader2, DollarSign, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import { PriceHistoryDisplay } from './price-history-display'

interface Ingredient {
  id: string
  name: string
  purchasePrice: number
  packageSize: number
  costPerUnit: number
  purchaseUnit: {
    id: string
    name: string
    symbol: string
  }
}

interface PriceUpdateDialogProps {
  ingredient: Ingredient
  isOpen: boolean
  onClose: () => void
  onUpdate: () => void
}

export function PriceUpdateDialog({ ingredient, isOpen, onClose, onUpdate }: PriceUpdateDialogProps) {
  const formRef = useRef<HTMLFormElement>(null)
  const [formData, setFormData] = useState({
    newPrice: ingredient.purchasePrice,
    newPackageSize: ingredient.packageSize
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch(`/api/ingredients/${ingredient.id}/price`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newPrice: formData.newPrice,
          newPackageSize: formData.newPackageSize
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update price')
      }

      const result = await response.json()
      toast.success('Harga berhasil diperbarui!')
      
      if (result.priceChange.changeType !== 'no_change') {
        const changeIcon = result.priceChange.changeType === 'increase' ? '📈' : '📉'
        const changeText = result.priceChange.changeType === 'increase' ? 'Naik' : 'Turun'
        toast.success(`${changeIcon} Harga ${changeText} ${result.priceChange.percentageChange.toFixed(2)}%`)
      }
      
      onUpdate()
      onClose()
    } catch (error) {
      console.error('Error updating price:', error)
      toast.error(error instanceof Error ? error.message : 'Gagal memperbarui harga')
    } finally {
      setLoading(false)
    }
  }

  const priceChange = formData.newPrice - ingredient.purchasePrice
  const percentageChange = ingredient.purchasePrice > 0 ? (priceChange / ingredient.purchasePrice) * 100 : 0
  const changeType = priceChange > 0 ? 'increase' : priceChange < 0 ? 'decrease' : 'no_change'

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title="Update Harga Bahan" 
      size="lg"
      footer={
        <>
          <Button type="button" variant="outline" onClick={onClose} className="flex-1 h-12" disabled={loading}>
            Batal
          </Button>
          <Button type="button" onClick={() => formRef.current?.requestSubmit()} disabled={loading} className="flex-1 h-12 bg-green-600 hover:bg-green-700">
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : 'Update Harga'}
          </Button>
        </>
      }
    >
      <div className="p-6 bg-gradient-to-br from-green-50 via-white to-emerald-50">
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
          {/* Current Price Display */}
          <div  style={{ 
        background: "var(--color-panel-solid)"
      }} className="rounded-xl p-6 shadow-sm border border-green-100">
            <h3 className="text-lg font-semibold text-green-700 mb-4">Harga Saat Ini</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Harga Beli</div>
                <div className="text-2xl font-bold text-gray-900">
                  Rp {ingredient.purchasePrice.toLocaleString('id-ID')}
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">Jumlah Beli</div>
                <div className="text-2xl font-bold text-gray-900">
                  {ingredient.packageSize} {ingredient.purchaseUnit.symbol}
                </div>
              </div>
            </div>
          </div>

          {/* New Price Input */}
          <div  style={{ 
        background: "var(--color-panel-solid)"
      }} className="rounded-xl p-6 shadow-sm border border-blue-100">
            <h3 className="text-lg font-semibold text-blue-700 mb-4">Harga Baru</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Harga Beli Baru</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">Rp</span>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.newPrice}
                    onChange={(e) => setFormData(prev => ({ ...prev, newPrice: parseFloat(e.target.value) || 0 }))}
                    className="h-11 pl-10 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">Jumlah Beli Baru</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.newPackageSize}
                  onChange={(e) => setFormData(prev => ({ ...prev, newPackageSize: parseFloat(e.target.value) || 1 }))}
                  className="h-11 border-2 border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Price Change Preview */}
          {priceChange !== 0 && (
            <div  style={{ 
        background: "var(--color-panel-solid)"
      }} className="rounded-xl p-6 shadow-sm border border-orange-100">
              <h3 className="text-lg font-semibold text-orange-700 mb-4">Preview Perubahan</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="text-center p-4 rounded-lg border">
                  <div className="text-sm text-gray-600 mb-1">Perubahan Harga</div>
                  <div className={`text-xl font-bold ${changeType === 'increase' ? 'text-red-600' : 'text-green-600'}`}>
                    {changeType === 'increase' ? '+' : ''}Rp {Math.abs(priceChange).toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="text-center p-4 rounded-lg border">
                  <div className="text-sm text-gray-600 mb-1">Persentase</div>
                  <div className={`text-xl font-bold ${changeType === 'increase' ? 'text-red-600' : 'text-green-600'}`}>
                    <span className={changeType === 'increase' ? 'text-red-600' : 'text-green-600'}>
                      {changeType === 'increase' ? '+' : ''}{Math.abs(percentageChange).toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Price History */}
          <div  style={{ 
        background: "var(--color-panel-solid)"
      }} className="rounded-xl p-6 shadow-sm border border-purple-100">
            <PriceHistoryDisplay ingredientId={ingredient.id} currentPrice={ingredient.purchasePrice} />
          </div>


        </form>
      </div>
    </Modal>
  )
}
