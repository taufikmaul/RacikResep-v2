"use client"

import { useMemo, useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useDecimalSettings } from '@/hooks/useDecimalSettings'
import { formatCurrency } from '@/lib/utils'

interface MinimalRecipe {
  id: string
  name: string
  cogsPerServing: number
  sellingPrice: number
}

interface BulkPriceDialogProps {
  isOpen: boolean
  onClose: () => void
  selectedIds: string[]
  selectedRecipes: MinimalRecipe[]
  onUpdated: (count: number) => void
}

export function BulkPriceDialog({ isOpen, onClose, selectedIds, selectedRecipes, onUpdated }: BulkPriceDialogProps) {
  const { settings: decimalSettings } = useDecimalSettings()
  const [mode, setMode] = useState<'set' | 'increase_percent' | 'decrease_percent' | 'increase_amount' | 'decrease_amount'>('set')
  const [value, setValue] = useState<number>(0)
  const [reason, setReason] = useState<string>("")
  const [loading, setLoading] = useState(false)

  const computeNewPrice = (currentPrice: number) => {
    const price = currentPrice || 0
    const val = Number(value) || 0
    switch (mode) {
      case 'set':
        return Math.max(0, Math.round(val))
      case 'increase_percent':
        return Math.max(0, Math.round(price * (1 + val / 100)))
      case 'decrease_percent':
        return Math.max(0, Math.round(price * (1 - val / 100)))
      case 'increase_amount':
        return Math.max(0, Math.round(price + val))
      case 'decrease_amount':
        return Math.max(0, Math.round(price - val))
      default:
        return price
    }
  }

  const previewRows = useMemo(() => {
    return (selectedRecipes || []).map((r) => {
      const currentPrice = Number(r.sellingPrice) || 0
      const newPrice = computeNewPrice(currentPrice)
      const priceChange = newPrice - currentPrice
      const percentageChange = currentPrice > 0 ? (priceChange / currentPrice) * 100 : 0
      const newProfitMargin = r.cogsPerServing > 0 && newPrice > 0
        ? ((newPrice - r.cogsPerServing) / newPrice) * 100
        : 0
      const willChange = newPrice !== currentPrice
      return {
        id: r.id,
        name: r.name,
        currentPrice,
        newPrice,
        priceChange,
        percentageChange,
        newProfitMargin,
        willChange
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedRecipes, mode, value])

  const summary = useMemo(() => {
    const changed = previewRows.filter(r => r.willChange)
    const totalDelta = changed.reduce((acc, r) => acc + r.priceChange, 0)
    return {
      totalSelected: selectedIds.length,
      totalWillChange: changed.length,
      totalDelta
    }
  }, [previewRows, selectedIds.length])

  const fmt = (n: number) => (decimalSettings ? formatCurrency(n, decimalSettings) : `Rp ${Math.round(n).toLocaleString('id-ID')}`)
  const fmtPct = (n: number) => `${n.toFixed(1)}%`

  const handleSubmit = async () => {
    if (!selectedIds?.length) return
    if (!summary.totalWillChange) return

    try {
      setLoading(true)
      const res = await fetch('/api/recipes/bulk-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipeIds: selectedIds, mode, value, reason: reason?.trim() || 'Bulk price update' })
      })
      if (res.ok) {
        const data = await res.json()
        onUpdated(data.updatedCount || 0)
      } else {
        const err = await res.json().catch(() => ({}))
        console.error('Bulk update failed', err)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Bulk Update Prices" size="xl">
      <div className="space-y-4 p-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Metode Pembaruan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-1">
                <label className="block text-sm text-gray-600 mb-1">Metode</label>
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value as any)}
                  className="w-full border rounded-md px-3 py-2 text-sm"
                >
                  <option value="set">Set harga ke nilai tertentu</option>
                  <option value="increase_percent">Naikkan dengan persentase (%)</option>
                  <option value="decrease_percent">Turunkan dengan persentase (%)</option>
                  <option value="increase_amount">Tambah nominal (+)</option>
                  <option value="decrease_amount">Kurangi nominal (-)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  {mode.includes('percent') ? 'Nilai (%)' : 'Nilai (Rp)'}
                </label>
                <Input
                  type="number"
                  value={Number.isFinite(value) ? value : 0}
                  onChange={(e) => setValue(parseFloat(e.target.value))}
                  placeholder={mode.includes('percent') ? 'contoh: 10' : 'contoh: 1000'}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Alasan (opsional)</label>
                <Input
                  type="text"
                  value={reason || ''}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Contoh: Penyesuaian harga grosir"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Tinjauan Perubahan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm text-gray-700 flex flex-wrap items-center gap-4">
              <span>Total dipilih: <strong>{summary.totalSelected}</strong></span>
              <span>Akan berubah: <strong>{summary.totalWillChange}</strong></span>
              <span>Perubahan total: <strong>{fmt(summary.totalDelta)}</strong></span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left px-3 py-2">Resep</th>
                    <th className="text-right px-3 py-2">Harga Saat Ini</th>
                    <th className="text-right px-3 py-2">Harga Baru</th>
                    <th className="text-right px-3 py-2">Perubahan</th>
                    <th className="text-right px-3 py-2">Perubahan (%)</th>
                    <th className="text-right px-3 py-2">Margin Baru</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={row.id} className="border-b hover:bg-gray-50">
                      <td className="px-3 py-2">{row.name}</td>
                      <td className="px-3 py-2 text-right">{fmt(row.currentPrice)}</td>
                      <td className="px-3 py-2 text-right font-medium">{fmt(row.newPrice)}</td>
                      <td className={`px-3 py-2 text-right ${row.priceChange === 0 ? '' : row.priceChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmt(row.priceChange)}
                      </td>
                      <td className={`px-3 py-2 text-right ${row.percentageChange === 0 ? '' : row.percentageChange > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {fmtPct(row.percentageChange)}
                      </td>
                      <td className="px-3 py-2 text-right">{fmtPct(row.newProfitMargin)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>Batal</Button>
          <Button onClick={handleSubmit} disabled={loading || !selectedIds?.length || summary.totalWillChange === 0}>Terapkan</Button>
        </div>
      </div>
    </Modal>
  )
}
