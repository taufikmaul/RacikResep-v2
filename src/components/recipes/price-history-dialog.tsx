'use client'

import { DollarSign } from 'lucide-react'
import { ReusablePriceHistoryDialog, PriceHistoryEntry } from '@/components/ui/reusable-price-history-dialog'

interface Recipe {
  id: string
  name: string
  sku?: string
  cogsPerServing: number
  sellingPrice: number
}

interface PriceHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  recipe: Recipe
  priceHistory: PriceHistoryEntry[]
}

export function PriceHistoryDialog({
  isOpen,
  onClose,
  recipe,
  priceHistory
}: PriceHistoryDialogProps) {
  return (
    <ReusablePriceHistoryDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Price History - ${recipe.name}`}
      priceHistory={priceHistory}
      emptyStateMessage="Belum ada riwayat perubahan harga untuk resep ini"
      emptyStateIcon={<DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
      showMarginStats={true}
      size="2xl"
    />
  )
}
