'use client'

import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown, Minus, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PriceHistoryItem {
  id: string
  oldPrice: number
  newPrice: number
  priceChange: number
  percentageChange: number
  changeType: string
  changeDate: string
}

interface PriceHistoryDisplayProps {
  ingredientId: string
  currentPrice: number
}

export function PriceHistoryDisplay({ ingredientId, currentPrice }: PriceHistoryDisplayProps) {
  const [priceHistory, setPriceHistory] = useState<PriceHistoryItem[]>([])
  const [loading, setLoading] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)

  const fetchPriceHistory = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/ingredients/${ingredientId}/price`)
      if (response.ok) {
        const result = await response.json()
        setPriceHistory(result.priceHistory || [])
      }
    } catch (error) {
      console.error('Error fetching price history:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isExpanded) {
      fetchPriceHistory()
    }
  }, [isExpanded, ingredientId])

  if (priceHistory.length === 0 && !isExpanded) {
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsExpanded(true)}
        className="text-blue-600 hover:text-blue-700 p-0 h-auto"
      >
        📊 Lihat Riwayat Harga
      </Button>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-gray-900">Riwayat Perubahan Harga</h4>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-blue-600 hover:text-blue-700 p-0 h-auto"
        >
          {isExpanded ? '📊 Sembunyikan' : '📊 Lihat Riwayat'}
        </Button>
      </div>

      {isExpanded && (
        <div className="space-y-2">
          {loading ? (
            <div className="text-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
              <p className="text-sm text-gray-500 mt-2">Memuat riwayat...</p>
            </div>
          ) : priceHistory.length > 0 ? (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {priceHistory.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      {item.changeType === 'increase' ? (
                        <TrendingUp className="h-4 w-4 text-red-500" />
                      ) : item.changeType === 'decrease' ? (
                        <TrendingDown className="h-4 w-4 text-green-500" />
                      ) : (
                        <Minus className="h-4 w-4 text-gray-500" />
                      )}
                      <span className="text-sm font-medium text-gray-900">
                        {item.changeType === 'increase' ? 'Naik' : item.changeType === 'decrease' ? 'Turun' : 'Tidak berubah'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="text-sm text-gray-600">
                      <span className="font-medium">Rp {item.oldPrice.toLocaleString('id-ID')}</span>
                      <span className="mx-1">→</span>
                      <span className="font-medium">Rp {item.newPrice.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {item.changeType !== 'no_change' && (
                        <span className={item.changeType === 'increase' ? 'text-red-600' : 'text-green-600'}>
                          {item.changeType === 'increase' ? '+' : ''}{item.percentageChange.toFixed(2)}%
                        </span>
                      )}
                      <span className="ml-2">
                        {new Date(item.changeDate).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              <Calendar className="h-8 w-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm">Belum ada riwayat perubahan harga</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
