'use client'

import { DollarSign } from 'lucide-react'
import { ReusablePriceHistoryDialog, PriceHistoryEntry } from '@/components/ui/reusable-price-history-dialog'

interface ChannelPriceHistoryDialogProps {
  isOpen: boolean
  onClose: () => void
  recipeName: string
  channelName: string
  priceHistory: PriceHistoryEntry[]
}

export function ChannelPriceHistoryDialog({
  isOpen,
  onClose,
  recipeName,
  channelName,
  priceHistory
}: ChannelPriceHistoryDialogProps) {
  return (
    <ReusablePriceHistoryDialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Price History - ${recipeName} (${channelName})`}
      priceHistory={priceHistory}
      emptyStateMessage="Belum ada riwayat perubahan harga untuk channel ini"
      emptyStateIcon={<DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />}
      showMarginStats={true}
      size="2xl"
    />
  )
}
