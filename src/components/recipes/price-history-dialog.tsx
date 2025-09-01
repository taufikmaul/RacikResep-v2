'use client'

import { Modal } from '@/components/ui/modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { useDecimalSettings } from '@/hooks/useDecimalSettings'
import { formatCurrency } from '@/lib/utils'

interface Recipe {
  id: string
  name: string
  sku?: string
  cogsPerServing: number
  sellingPrice: number
}

interface PriceHistory {
  id: string
  oldPrice: number
  newPrice: number
  priceChange: number
  percentageChange: number
  changeType: string
  changeDate: string
  reason?: string
}

interface PriceHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  recipe: Recipe
  priceHistory: PriceHistory[]
}

export function PriceHistoryDialog({
  isOpen,
  onClose,
  recipe,
  priceHistory
}: PriceHistoryDialogProps) {
  const { settings: decimalSettings } = useDecimalSettings()

  const getChangeTypeIcon = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'decrease':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Minus className="h-4 w-4 text-gray-600" />
    }
  }

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600 bg-green-100'
      case 'decrease':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Price History - ${recipe.name}`}
      size="2xl"
    >

        <div className="space-y-6">
          {/* Recipe Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Recipe Summary</CardTitle>
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
                  <p className="text-sm text-gray-500 mb-1">Profit Margin</p>
                  <p className="text-xl font-bold text-green-600">
                    {recipe?.sellingPrice && recipe?.cogsPerServing ? 
                      ((recipe.sellingPrice - recipe.cogsPerServing) / recipe.sellingPrice * 100).toFixed(1) : '0.0'}%
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Price History */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Price Change History</CardTitle>
            </CardHeader>
            <CardContent>
              {priceHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>Belum ada riwayat perubahan harga untuk resep ini.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {priceHistory.map((history, index) => (
                    <div key={history.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getChangeTypeIcon(history.changeType)}
                            <Badge className={getChangeTypeColor(history.changeType)}>
                              {history.changeType === 'increase' ? 'Kenaikan' : 
                               history.changeType === 'decrease' ? 'Penurunan' : 'Tidak Berubah'}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDate(history.changeDate)}
                            </span>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Harga Lama</p>
                              <p className="font-semibold text-gray-700">
                                {history.oldPrice ? (decimalSettings ? formatCurrency(history.oldPrice, decimalSettings) : `Rp ${history.oldPrice.toLocaleString('id-ID')}`) : 'Rp 0'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Harga Baru</p>
                              <p className="font-semibold text-blue-600">
                                {history.newPrice ? (decimalSettings ? formatCurrency(history.newPrice, decimalSettings) : `Rp ${history.newPrice.toLocaleString('id-ID')}`) : 'Rp 0'}
                              </p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500 mb-1">Perubahan</p>
                              <div className="space-y-1">
                                <p className={`font-semibold ${history.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {history.priceChange >= 0 ? '+' : ''}
                                  {decimalSettings ? formatCurrency(history.priceChange, decimalSettings) : `Rp ${history.priceChange.toLocaleString('id-ID')}`}
                                </p>
                                <p className={`text-sm ${history.percentageChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {history.percentageChange >= 0 ? '+' : ''}
                                  {history.percentageChange ? history.percentageChange.toFixed(1) : '0.0'}%
                                </p>
                              </div>
                            </div>
                          </div>
                          
                          {history.reason && (
                            <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                              <p className="text-sm text-blue-800">
                                <span className="font-medium">Alasan:</span> {history.reason}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </Modal>
    )
}
