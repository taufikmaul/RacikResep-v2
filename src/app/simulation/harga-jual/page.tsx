'use client'

import { useState, useEffect, useMemo } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Calculator, 
  ShoppingCart, 
  Target, 
  HelpCircle, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  FileText,
  Download,
  Sparkles
} from 'lucide-react'
import toast from 'react-hot-toast'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useDecimalSettings } from '@/hooks/useDecimalSettings'
import { formatCurrency } from '@/lib/utils'

interface Recipe {
  id: string
  name: string
  cogsPerServing: number
  sku?: string
  description?: string
  yield?: number
  totalCOGS?: number
  basePrice?: number
  sellingPrice?: number
}

interface SalesChannel {
  id: string
  name: string
  commission: number // in %
}

type TaxOption = 'none' | 'pb1' | 'ppn11'

interface CalcState {
  // global
  tax: TaxOption
  manualTaxRate: number // for future custom tax
  channelId: string

  // calculator choices
  mode:
    | 'minProfitRp'
    | 'minProfitPctNet'
    | 'minProfitPctHPP'
    | 'hppMaxRp'
    | 'hppMaxPctNet'
    | 'netSalesXHPP'
    | 'netSalesRp'
    | 'consumerPaysRp'
    | 'priceBeforeTaxRp'

  value: number
}

export default function SimulationHargaJualPage() {
  const { data: session } = useSession()
  const { settings: decimalSettings } = useDecimalSettings()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  
  const [saveDate, setSaveDate] = useState<string>(() => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  })
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [state, setState] = useState<CalcState>({
    tax: 'ppn11',
    manualTaxRate: 0,
    channelId: '',
    mode: 'minProfitPctNet',
    value: 30
  })

  useEffect(() => {
    console.log('Session changed:', session)
    if (session) {
      console.log('Session user:', session.user)
      console.log('Session user business:', session.user?.business)
      void fetchData()
    } else {
      console.log('No session, setting loading to false')
      setLoading(false)
    }
  }, [session])

  useEffect(() => {
    if (!state.channelId && salesChannels.length) {
      setState((s) => ({ ...s, channelId: salesChannels[0].id }))
    }
  }, [salesChannels])

  // Debug: Log recipes state changes
  useEffect(() => {
    console.log('Recipes state changed:', recipes)
    console.log('Recipes length:', recipes.length)
    console.log('First recipe:', recipes[0])
  }, [recipes])

  function handleExportCSV() {
    if (!Array.isArray(salesChannels)) {
      toast.error('Data channel belum tersedia')
      return
    }
    
    const selectedChannel = salesChannels.find(c => c.id === state.channelId)
    if (!selectedRecipe || !selectedChannel) {
      toast.error('Pilih resep dan channel terlebih dahulu')
      return
    }
    const r = solve()
    if (!r) return
    const rows = [
      ['Tanggal', saveDate],
      ['Resep', selectedRecipe.name],
      ['Channel', selectedChannel.name],
      ['HPP per unit', selectedRecipe.cogsPerServing],
      ['Target Mode', state.mode],
      ['Target Value', state.value],
      ['Tax', state.tax],
      ['Total Konsumen Bayar', r.totalPay],
      ['Pajak', r.taxAmt],
      ['Harga Jual Sebelum Pajak', r.Pbt],
      ['Bayar Komisi Channel', r.fee],
      ['Net Sales', r.netSales],
      ['Gross Profit', r.grossProfit],
      ['% HPP terhadap Net Sales', `${r.pctHppToNet.toFixed(1)}%`],
      ['% Gross Profit terhadap Net Sales', `${r.pctGrossToNet.toFixed(1)}%`],
    ]
    const csvContent = rows.map(row => row.join(',')).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `simulasi-harga-${selectedRecipe.name}-${saveDate}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
    toast.success('File CSV berhasil diunduh')
  }

  async function fetchData() {
    try {
      console.log('Fetching data...')
      const [recipesRes, channelsRes] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/sales-channels')
      ])
      
      console.log('Recipes response status:', recipesRes.status)
      console.log('Channels response status:', channelsRes.status)
      
      const [recipesData, channelsData] = await Promise.all([
        recipesRes.json(),
        channelsRes.json()
      ])
      
      console.log('Recipes data:', recipesData)
      console.log('Channels data:', channelsData)
      console.log('Recipes is array:', Array.isArray(recipesData))
      console.log('Recipes length:', Array.isArray(recipesData) ? recipesData.length : 'Not an array')
      console.log('Recipes data.data:', recipesData?.data)
      console.log('Recipes data.data length:', recipesData?.data?.length)
      console.log('Recipes data.data is array:', Array.isArray(recipesData?.data))
      
      // Ensure we're setting arrays - handle API response structure
      const recipesArray = recipesData?.data || recipesData
      const channelsArray = channelsData?.data || channelsData
      
      setRecipes(Array.isArray(recipesArray) ? recipesArray : [])
      setSalesChannels(Array.isArray(channelsArray) ? channelsArray : [])
    } catch (error) {
      console.error('Error fetching data:', error)
      toast.error('Gagal memuat data')
      // Set empty arrays on error to prevent crashes
      setRecipes([])
      setSalesChannels([])
    } finally {
      setLoading(false)
    }
  }

  function solve() {
    if (!selectedRecipe || !state.channelId) return null
    
    if (!Array.isArray(salesChannels)) return null
    
    const selectedChannel = salesChannels.find(c => c.id === state.channelId)
    if (!selectedChannel) return null
    
    const HPP = selectedRecipe.cogsPerServing
    const c = selectedChannel.commission / 100
    const t = state.tax === 'ppn11' ? 0.11 : state.tax === 'pb1' ? 0.1 : 0
    const v = state.value

    function byPbt(Pbt: number) {
      const totalPay = Pbt * (1 + t)
      const taxAmt = Pbt * t
      const fee = totalPay * c
      const netSales = totalPay - fee
      const grossProfit = netSales - HPP
      const pctHppToNet = (HPP / netSales) * 100
      const pctGrossToNet = (grossProfit / netSales) * 100

      return {
        totalPay,
        taxAmt,
        Pbt,
        fee,
        netSales,
        grossProfit,
        pctHppToNet,
        pctGrossToNet
      }
    }

    switch (state.mode) {
      case 'minProfitRp': {
        const targetProfit = Math.max(0, v)
        const Pbt = (HPP + targetProfit) / ((1 - c) * (1 + t))
        return byPbt(Pbt)
      }
      case 'minProfitPctNet': {
        const targetPct = Math.max(0, v) / 100
        const Pbt = HPP / ((1 - targetPct - c) * (1 + t))
        return byPbt(Pbt)
      }
      case 'minProfitPctHPP': {
        const targetPct = Math.max(0, v) / 100
        const targetProfit = HPP * targetPct
        const Pbt = (HPP + targetProfit) / ((1 - c) * (1 + t))
        return byPbt(Pbt)
      }
      case 'hppMaxRp': {
        const maxHPP = Math.max(0, v)
        const Pbt = maxHPP / ((1 - c) * (1 + t))
        return byPbt(Pbt)
      }
      case 'hppMaxPctNet': {
        const maxHPPPct = Math.max(0, v) / 100
        const Pbt = HPP / (maxHPPPct * (1 + t))
        return byPbt(Pbt)
      }
      case 'netSalesXHPP': {
        const multiplier = Math.max(0, v)
        const targetNet = HPP * multiplier
        const Pbt = targetNet / ((1 + t) * (1 - c))
        return byPbt(Pbt)
      }
      case 'netSalesRp': {
        const targetNet = Math.max(0, v)
        const Pbt = targetNet / ((1 + t) * (1 - c))
        return byPbt(Pbt)
      }
      case 'consumerPaysRp': {
        const totalPay = Math.max(0, v)
        const Pbt = totalPay / (1 + t)
        return byPbt(Pbt)
      }
      case 'priceBeforeTaxRp': {
        const Pbt = Math.max(0, v)
        return byPbt(Pbt)
      }
      default:
        return byPbt(0)
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid gap-6">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-40 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </DashboardLayout>
    )
  }

  const calculationResult = solve()

  return (
    <DashboardLayout>
      <div className="container mx-auto p-4 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2 text-blue-600">
            <Calculator className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Simulasi Harga Jual</h1>
          </div>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Optimalkan harga jual dengan kalkulasi yang tepat berdasarkan target profit, pajak, dan komisi channel
          </p>
        </div>

        {/* Main Calculator */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Left Column - Recipe & Channel Selection */}
          <div className="space-y-6">
            {/* Recipe Selection */}
            <Card className="border-2 border-blue-50 hover:border-blue-100 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <ShoppingCart className="h-5 w-5 text-blue-600" />
                  Pilih Resep
                </CardTitle>
                <CardDescription>Resep yang akan dihitung harga jualnya</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Input
                  placeholder="🔍 Cari resep..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border-blue-200 focus:border-blue-500"
                />

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {loading ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto mb-2"></div>
                      Memuat resep...
                    </div>
                  ) : Array.isArray(recipes) && recipes.length > 0 ? (
                    recipes
                      .filter((r) => r.name.toLowerCase().includes(search.toLowerCase()))
                      .map((recipe) => (
                        <div
                          key={recipe.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedRecipe?.id === recipe.id
                              ? 'border-blue-500 bg-blue-50 shadow-md scale-[1.02]'
                              : 'border-gray-200 hover:border-blue-300 hover:bg-blue-25'
                          }`}
                          onClick={() => setSelectedRecipe(recipe)}
                        >
                          <div className="font-medium text-gray-900">{recipe.name}</div>
                          <div className="text-sm text-gray-600 flex items-center gap-1">
                            <DollarSign className="h-3 w-3" />
                            HPP: {recipe.cogsPerServing ? (
                              decimalSettings ? formatCurrency(recipe.cogsPerServing, decimalSettings) : `Rp ${recipe.cogsPerServing.toLocaleString('id-ID')}`
                            ) : (
                              'Belum dihitung'
                            )}
                          </div>
                        </div>
                      ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      Tidak ada resep ditemukan
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Channel & Tax Selection */}
            <Card className="border-2 border-green-50 hover:border-green-100 transition-colors">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="h-5 w-5 text-green-600" />
                  Channel & Pajak
                </CardTitle>
                <CardDescription>Pilih platform dan jenis pajak</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Platform Penjualan</label>
                  <div className="space-y-2">
                    {Array.isArray(salesChannels) && salesChannels.map((channel) => (
                      <label key={channel.id} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="radio"
                          name="channel"
                          checked={state.channelId === channel.id}
                          onChange={() => setState((s) => ({ ...s, channelId: channel.id }))}
                          className="text-green-600"
                        />
                        <span className="font-medium">{channel.name}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {channel.commission}% komisi
                        </Badge>
                      </label>
                    ))}
                    {(!Array.isArray(salesChannels) || salesChannels.length === 0) && (
                      <div className="text-center py-4 text-gray-500">
                        {!Array.isArray(salesChannels) ? 'Memuat channel...' : 'Tidak ada channel tersedia'}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Jenis Pajak</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input type="radio" name="tax" checked={state.tax==='none'} onChange={() => setState(s=>({...s,tax:'none'}))} />
                      <span>Tanpa Pajak</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input type="radio" name="tax" checked={state.tax==='pb1'} onChange={() => setState(s=>({...s,tax:'pb1'}))} />
                      <span>Pajak Restoran (PB1 10%)</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded">
                      <input type="radio" name="tax" checked={state.tax==='ppn11'} onChange={() => setState(s=>({...s,tax:'ppn11'}))} />
                      <span>PPN 11%</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Center Column - Calculator Options */}
          <Card className="border-2 border-purple-50 hover:border-purple-100 transition-colors">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Sparkles className="h-5 w-5 text-purple-600" />
                Target Kalkulasi
              </CardTitle>
              <CardDescription>Pilih target yang ingin dicapai</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Profit Target Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  Target Keuntungan
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded border border-gray-200 hover:border-purple-300 transition-colors">
                        <input type="radio" name="mode" checked={state.mode==='minProfitRp'} onChange={()=>setState(s=>({...s,mode:'minProfitRp'}))} className="text-purple-600" />
                        <span>Keuntungan minimal dalam Rupiah</span>
                      </label>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Keuntungan Minimal dalam Rupiah</h4>
                        <p className="text-sm text-gray-600">
                          Tentukan jumlah keuntungan minimal yang Anda inginkan dalam rupiah per unit.
                        </p>
                        <p className="text-sm text-gray-500">
                          Contoh: Rp 5.000 per unit
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded border border-gray-200 hover:border-purple-300 transition-colors">
                        <input type="radio" name="mode" checked={state.mode==='minProfitPctNet'} onChange={()=>setState(s=>({...s,mode:'minProfitPctNet'}))} className="text-purple-600" />
                        <span>Keuntungan minimal dalam % dari net sales</span>
                      </label>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Keuntungan Minimal dalam % dari Net Sales</h4>
                        <p className="text-sm text-gray-600">
                          Tentukan persentase keuntungan minimal dari net sales (pendapatan setelah komisi).
                        </p>
                        <p className="text-sm text-gray-500">
                          Contoh: 30% dari net sales
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded border border-gray-200 hover:border-purple-300 transition-colors">
                        <input type="radio" name="mode" checked={state.mode==='minProfitPctHPP'} onChange={()=>setState(s=>({...s,mode:'minProfitPctHPP'}))} className="text-purple-600" />
                        <span>Keuntungan minimal dalam % dari HPP</span>
                      </label>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Keuntungan Minimal dalam % dari HPP</h4>
                        <p className="text-sm text-gray-600">
                          Tentukan persentase keuntungan minimal dari HPP (Harga Pokok Produksi).
                        </p>
                        <p className="text-sm text-gray-500">
                          Contoh: 50% dari HPP
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
                
                <Input 
                  type="number" 
                  value={state.value.toString()} 
                  onChange={(e) => {
                    const value = e.target.value
                    if (value === '' || value === '0') {
                      setState(s => ({ ...s, value: 0 }))
                    } else {
                      const parsed = parseFloat(value)
                      if (!isNaN(parsed) && parsed >= 0) {
                        setState(s => ({ ...s, value: parsed }))
                      }
                    }
                  }} 
                  placeholder="Masukkan nilai target..."
                  className="border-purple-200 focus:border-purple-500"
                />
              </div>

              {/* Alternative Targets Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                  <Target className="h-4 w-4 text-orange-600" />
                  Target Alternatif
                </div>
                <div className="grid grid-cols-1 gap-2">
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded border border-gray-200 hover:border-orange-300 transition-colors">
                        <input type="radio" name="mode2" checked={state.mode==='hppMaxRp'} onChange={()=>setState(s=>({...s,mode:'hppMaxRp'}))} className="text-orange-600" />
                        <span>HPP maksimal dalam Rupiah</span>
                      </label>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-semibold">HPP Maksimal dalam Rupiah</h4>
                        <p className="text-sm text-gray-600">
                          Tentukan jumlah HPP maksimal yang diizinkan per unit.
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded border border-gray-200 hover:border-orange-300 transition-colors">
                        <input type="radio" name="mode2" checked={state.mode==='netSalesXHPP'} onChange={()=>setState(s=>({...s,mode:'netSalesXHPP'}))} className="text-orange-600" />
                        <span>Net sales sebagai kelipatan HPP</span>
                      </label>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Net Sales sebagai Kelipatan dari HPP</h4>
                        <p className="text-sm text-gray-600">
                          Tentukan berapa kali lipat net sales terhadap HPP.
                        </p>
                        <p className="text-sm text-gray-500">
                          Contoh: 2.5x berarti net sales = 2.5 × HPP
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                  
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-gray-50 p-2 rounded border border-gray-200 hover:border-orange-300 transition-colors">
                        <input type="radio" name="mode2" checked={state.mode==='netSalesRp'} onChange={()=>setState(s=>({...s,mode:'netSalesRp'}))} className="text-orange-600" />
                        <span>Net sales dalam Rupiah</span>
                      </label>
                    </HoverCardTrigger>
                    <HoverCardContent className="w-80">
                      <div className="space-y-2">
                        <h4 className="font-semibold">Net Sales dalam Rupiah</h4>
                        <p className="text-sm text-gray-600">
                          Tentukan jumlah net sales yang diinginkan per unit.
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Right Column - Results */}
          <div className="space-y-6">
            {/* Quick Summary */}
            {selectedRecipe && (
              <Card className="border-2 border-blue-100 bg-gradient-to-br from-blue-50 to-indigo-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg text-blue-900">
                    <FileText className="h-5 w-5" />
                    Ringkasan Resep
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <div className="font-medium text-blue-900">{selectedRecipe.name}</div>
                    <div className="text-sm text-blue-700 flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      HPP: {decimalSettings ? formatCurrency(selectedRecipe.cogsPerServing, decimalSettings) : `Rp ${selectedRecipe.cogsPerServing.toLocaleString('id-ID')}`}
                    </div>
                  </div>
                  
                  {calculationResult && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-white rounded-lg p-3 border border-blue-200 text-center">
                        <div className="text-xs text-blue-600 mb-1">Harga Jual</div>
                        <div className="font-bold text-blue-900">
                          {decimalSettings ? formatCurrency(calculationResult.Pbt, decimalSettings) : `Rp ${calculationResult.Pbt.toLocaleString('id-ID')}`}
                        </div>
                      </div>
                      <div className="bg-white rounded-lg p-3 border border-blue-200 text-center">
                        <div className="text-xs text-blue-600 mb-1">Total Bayar</div>
                        <div className="font-bold text-blue-900">
                          {decimalSettings ? formatCurrency(calculationResult.totalPay, decimalSettings) : `Rp ${calculationResult.totalPay.toLocaleString('id-ID')}`}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Export Button */}
            {selectedRecipe && calculationResult && (
              <Card className="border-2 border-green-100 bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-4">
                  <Button 
                    onClick={handleExportCSV} 
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                    size="lg"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export Hasil Kalkulasi
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Results Section */}
        {selectedRecipe && calculationResult && (
          <div className="space-y-6">
            {/* Detailed Results */}
            <Card className="border-2 border-indigo-100 bg-gradient-to-br from-indigo-50 to-purple-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-indigo-900">
                  <Calculator className="h-6 w-6" />
                  Hasil Kalkulasi Lengkap
                </CardTitle>
                <CardDescription className="text-indigo-700">
                  Breakdown detail dari semua komponen harga
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Column 1 - Harga & Pajak */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-indigo-800 border-b border-indigo-200 pb-2">Harga & Pajak</h4>
                    
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="space-y-2 cursor-help">
                          <label className="text-sm text-indigo-700 flex items-center gap-1">
                            Total Konsumen Bayar
                            <HelpCircle className="h-4 w-4 text-indigo-500" />
                          </label>
                          <div className="h-12 px-3 py-2 rounded-lg border-2 border-indigo-200 bg-white flex items-center justify-center font-semibold text-indigo-900">
                            {decimalSettings ? formatCurrency(calculationResult.totalPay, decimalSettings) : `Rp ${calculationResult.totalPay.toLocaleString('id-ID')}`}
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Total yang Dibayar Konsumen</h4>
                          <p className="text-sm text-gray-600">
                            Total harga yang harus dibayar konsumen, sudah termasuk semua komponen.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="space-y-2 cursor-help">
                          <label className="text-sm text-indigo-700 flex items-center gap-1">
                            Pajak
                            <HelpCircle className="h-4 w-4 text-indigo-500" />
                          </label>
                          <div className="h-12 px-3 py-2 rounded-lg border-2 border-indigo-200 bg-white flex items-center justify-center font-semibold text-indigo-900">
                            {decimalSettings ? formatCurrency(calculationResult.taxAmt, decimalSettings) : `Rp ${calculationResult.taxAmt.toLocaleString('id-ID')}`}
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Pajak yang Dikenakan</h4>
                          <p className="text-sm text-gray-600">
                            Jumlah pajak berdasarkan pilihan yang dipilih.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="space-y-2 cursor-help">
                          <label className="text-sm text-indigo-700 flex items-center gap-1">
                            Harga Jual (Sebelum Pajak)
                            <HelpCircle className="h-4 w-4 text-indigo-500" />
                          </label>
                          <div className="h-12 px-3 py-2 rounded-lg border-2 border-indigo-200 bg-white flex items-center justify-center font-semibold text-indigo-900">
                            {decimalSettings ? formatCurrency(calculationResult.Pbt, decimalSettings) : `Rp ${calculationResult.Pbt.toLocaleString('id-ID')}`}
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Harga Jual Sebelum Pajak</h4>
                          <p className="text-sm text-gray-600">
                            Harga jual yang Anda terima sebelum dikenakan pajak.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  
                  {/* Column 2 - Komisi & Profit */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-indigo-800 border-b border-indigo-200 pb-2">Komisi & Profit</h4>
                    
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="space-y-2 cursor-help">
                          <label className="text-sm text-indigo-700 flex items-center gap-1">
                            Komisi Channel
                            <HelpCircle className="h-4 w-4 text-indigo-500" />
                          </label>
                          <div className="h-12 px-3 py-2 rounded-lg border-2 border-indigo-200 bg-white flex items-center justify-center font-semibold text-indigo-900">
                            {decimalSettings ? formatCurrency(calculationResult.fee, decimalSettings) : `Rp ${calculationResult.fee.toLocaleString('id-ID')}`}
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Komisi Channel</h4>
                          <p className="text-sm text-gray-600">
                            Jumlah komisi yang dibayar ke platform penjualan.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="space-y-2 cursor-help">
                          <label className="text-sm text-indigo-700 flex items-center gap-1">
                            Net Sales
                            <HelpCircle className="h-4 w-4 text-indigo-500" />
                          </label>
                          <div className="h-12 px-3 py-2 rounded-lg border-2 border-indigo-200 bg-white flex items-center justify-center font-semibold text-indigo-900">
                            {decimalSettings ? formatCurrency(calculationResult.netSales, decimalSettings) : `Rp ${calculationResult.netSales.toLocaleString('id-ID')}`}
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Net Sales</h4>
                          <p className="text-sm text-gray-600">
                            Pendapatan bersih setelah dikurangi komisi channel.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="space-y-2 cursor-help">
                          <label className="text-sm text-indigo-700 flex items-center gap-1">
                            Gross Profit
                            <HelpCircle className="h-4 w-4 text-indigo-500" />
                          </label>
                          <div className="h-12 px-3 py-2 rounded-lg border-2 border-indigo-200 bg-white flex items-center justify-center font-semibold text-indigo-900">
                            {decimalSettings ? formatCurrency(calculationResult.grossProfit, decimalSettings) : `Rp ${calculationResult.grossProfit.toLocaleString('id-ID')}`}
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Gross Profit</h4>
                          <p className="text-sm text-gray-600">
                            Keuntungan kotor setelah dikurangi HPP.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  
                  {/* Column 3 - Persentase */}
                  <div className="space-y-4">
                    <h4 className="font-semibold text-indigo-800 border-b border-indigo-200 pb-2">Analisis Persentase</h4>
                    
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="space-y-2 cursor-help">
                          <label className="text-sm text-indigo-700 flex items-center gap-1">
                            % HPP vs Net Sales
                            <HelpCircle className="h-4 w-4 text-indigo-500" />
                          </label>
                          <div className="h-12 px-3 py-2 rounded-lg border-2 border-indigo-200 bg-white flex items-center justify-center font-semibold text-indigo-900">
                            {calculationResult.pctHppToNet.toFixed(1)}%
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Persentase HPP terhadap Net Sales</h4>
                          <p className="text-sm text-gray-600">
                            Semakin rendah persentase ini, semakin tinggi margin keuntungan.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                    
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="space-y-2 cursor-help">
                          <label className="text-sm text-indigo-700 flex items-center gap-1">
                            % Gross Profit vs Net Sales
                            <HelpCircle className="h-4 w-4 text-indigo-500" />
                          </label>
                          <div className="h-12 px-3 py-2 rounded-lg border-2 border-indigo-200 bg-white flex items-center justify-center font-semibold text-indigo-900">
                            {calculationResult.pctGrossToNet.toFixed(1)}%
                          </div>
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-80">
                        <div className="space-y-2">
                          <h4 className="font-semibold">Persentase Gross Profit terhadap Net Sales</h4>
                          <p className="text-sm text-gray-600">
                            Semakin tinggi persentase ini, semakin menguntungkan bisnis.
                          </p>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Charts Section */}
            <Card className="border-2 border-emerald-100 bg-gradient-to-br from-emerald-50 to-teal-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-xl text-emerald-900">
                  <TrendingUp className="h-6 w-6" />
                  Visualisasi Data
                </CardTitle>
                <CardDescription className="text-emerald-700">
                  Grafik komposisi biaya dan profit untuk analisis visual
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Profit vs HPP Chart */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-emerald-800 text-center">
                      Komposisi Net Sales
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            dataKey="value" 
                            data={[
                              { name: 'HPP', value: Math.max(0, selectedRecipe.cogsPerServing) },
                              { name: 'Gross Profit', value: Math.max(0, calculationResult.grossProfit) },
                            ]} 
                            outerRadius={80} 
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#3b82f6" />
                          </Pie>
                          <Tooltip 
                            formatter={(val: any) => 
                              decimalSettings ? formatCurrency(val as number, decimalSettings) : `Rp ${(val as number).toLocaleString('id-ID')}`
                            } 
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Total Payment Breakdown Chart */}
                  <div className="space-y-4">
                    <h4 className="text-lg font-semibold text-emerald-800 text-center">
                      Breakdown Total Bayar
                    </h4>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            dataKey="value" 
                            data={[
                              { name: 'Net Sales', value: Math.max(0, calculationResult.netSales) },
                              { name: 'Pajak', value: Math.max(0, calculationResult.taxAmt) },
                              { name: 'Komisi', value: Math.max(0, calculationResult.fee) },
                            ]} 
                            outerRadius={80} 
                            label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip 
                            formatter={(val: any) => 
                              decimalSettings ? formatCurrency(val as number, decimalSettings) : `Rp ${(val as number).toLocaleString('id-ID')}`
                            } 
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
