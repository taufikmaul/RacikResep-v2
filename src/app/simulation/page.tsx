'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, ShoppingCart, Target } from 'lucide-react'
import toast from 'react-hot-toast'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

interface Recipe {
  id: string
  name: string
  cogsPerServing: number
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

export default function SimulationPage() {
  const { data: session } = useSession()
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
    if (session) void fetchData()
  }, [session])

  useEffect(() => {
    if (!state.channelId && salesChannels.length) {
      setState((s) => ({ ...s, channelId: salesChannels[0].id }))
    }
  }, [salesChannels])

  function handleExportCSV() {
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
      ['Harga sebelum pajak', r.Pbt],
      ['Pajak', r.taxAmt],
      ['Total konsumen bayar', r.totalPay],
      ['Komisi channel', r.fee],
      ['Net Sales', r.netSales],
      ['Gross Profit', r.grossProfit],
      ['% HPP ke Net Sales', r.pctHppToNet],
      ['% GP ke Net Sales', r.pctGrossToNet],
    ]
    const csv = rows.map(([k, v]) => `${k},${typeof v === 'number' ? v : `"${String(v).replace(/"/g, '""')}"`}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `simulasi_${selectedRecipe.name.replace(/\s+/g, '_')}_${saveDate}.csv`
    a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV diekspor')
  }

  function handlePrint() {
    if (!selectedRecipe) {
      toast.error('Pilih resep terlebih dahulu')
      return
    }
    window.print()
  }

  function handleSaveLocal() {
    const selectedChannel = salesChannels.find(c => c.id === state.channelId)
    if (!selectedRecipe || !selectedChannel) {
      toast.error('Pilih resep dan channel terlebih dahulu')
      return
    }
    const r = solve()
    if (!r) return
    const key = 'racikresep_simulations'
    const prev = typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
    const arr = prev ? JSON.parse(prev) as any[] : []
    arr.push({
      date: saveDate,
      recipeId: selectedRecipe.id,
      recipeName: selectedRecipe.name,
      channelId: selectedChannel.id,
      channelName: selectedChannel.name,
      tax: state.tax,
      result: r,
      createdAt: new Date().toISOString(),
    })
    window.localStorage.setItem(key, JSON.stringify(arr))
    toast.success('Simulasi disimpan secara lokal')
  }

  const fetchData = async () => {
    try {
      const [recipesRes, channelsRes] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/sales-channels')
      ])

      if (recipesRes.ok) {
        const recipesJson = await recipesRes.json()
        const recipesData = Array.isArray(recipesJson) ? recipesJson : (recipesJson?.data ?? [])
        setRecipes(
          recipesData.map((r: { id: string; name: string; cogsPerServing: number }) => ({
            id: r.id,
            name: r.name,
            cogsPerServing: r.cogsPerServing || 0
          }))
        )
      }

      if (channelsRes.ok) {
        const channelsData: SalesChannel[] = await channelsRes.json()
        setSalesChannels(channelsData)
      }
    } catch (e) {
      console.error('Error fetching data:', e)
    } finally {
      setLoading(false)
    }
  }

  const taxRate = useMemo(() => {
    switch (state.tax) {
      case 'none':
        return 0
      case 'pb1':
        return 10
      case 'ppn11':
        return 11
      default:
        return 0
    }
  }, [state.tax])

  const currentChannel = salesChannels.find(c => c.id === state.channelId)
  const commissionRate = currentChannel?.commission ?? 0 // %

  // Core solver
  const solve = () => {
    if (!selectedRecipe) return null
    const HPP = selectedRecipe.cogsPerServing // per unit
    const t = taxRate / 100
    const c = commissionRate / 100

    // Let Pbt = price before tax (net of tax). Tax collected: taxAmt = Pbt * t.
    // Consumer pays: totalPay = Pbt * (1 + t).
    // Channel fee taken from consumer payment? Typically commission from gross (consumer pays).
    // We'll apply commission on consumer payment: fee = totalPay * c.
    // Net sales = totalPay - fee.
    // Gross profit = net sales - HPP.

    const byPbt = (Pbt: number) => {
      const totalPay = Pbt * (1 + t)
      const fee = totalPay * c
      const netSales = totalPay - fee
      const taxAmt = Pbt * t
      const grossProfit = netSales - HPP
      const pctHppToNet = netSales > 0 ? (HPP / netSales) * 100 : 0
      const pctGrossToNet = netSales > 0 ? (grossProfit / netSales) * 100 : 0
      return { Pbt, totalPay, fee, netSales, taxAmt, grossProfit, pctHppToNet, pctGrossToNet }
    }

    const v = state.value

    switch (state.mode) {
      case 'minProfitRp': {
        // grossProfit >= v => netSales - HPP >= v
        // netSales = totalPay - fee = Pbt(1+t) - c*Pbt(1+t) = Pbt(1+t)(1-c)
        // Pbt(1+t)(1-c) - HPP = v => Pbt = (HPP + v) / ((1+t)(1-c))
        const Pbt = (HPP + Math.max(0, v)) / ((1 + t) * (1 - c))
        return byPbt(Pbt)
      }
      case 'minProfitPctNet': {
        // grossProfit >= v% of netSales => netSales - HPP >= v/100 * netSales
        // netSales(1 - v/100) >= HPP => netSales >= HPP / (1 - v/100)
        const targetNet = HPP / (1 - Math.max(0, Math.min(99.9, v)) / 100)
        const Pbt = targetNet / ((1 + t) * (1 - c))
        return byPbt(Pbt)
      }
      case 'minProfitPctHPP': {
        // grossProfit >= v% of HPP => netSales - HPP >= v/100 * HPP
        // netSales >= HPP * (1 + v/100)
        const targetNet = HPP * (1 + Math.max(0, v) / 100)
        const Pbt = targetNet / ((1 + t) * (1 - c))
        return byPbt(Pbt)
      }
      case 'hppMaxRp': {
        // Constrain HPP <= v of netSales => HPP/netSales <= v
        // netSales >= HPP / v
        const vSafe = Math.max(1, v)
        const targetNet = HPP / vSafe
        const Pbt = targetNet / ((1 + t) * (1 - c))
        return byPbt(Pbt)
      }
      case 'hppMaxPctNet': {
        // HPP <= v% of netSales => netSales >= HPP / (v/100)
        const vPct = Math.max(1, Math.min(99.9, v)) / 100
        const targetNet = HPP / vPct
        const Pbt = targetNet / ((1 + t) * (1 - c))
        return byPbt(Pbt)
      }
      case 'netSalesXHPP': {
        // netSales = v * HPP
        const targetNet = Math.max(1, v) * HPP
        const Pbt = targetNet / ((1 + t) * (1 - c))
        return byPbt(Pbt)
      }
      case 'netSalesRp': {
        const targetNet = Math.max(0, v)
        const Pbt = targetNet / ((1 + t) * (1 - c))
        return byPbt(Pbt)
      }
      case 'consumerPaysRp': {
        // totalPay given => Pbt = totalPay/(1+t)
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

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Simulasi</h1>
          <p className="text-gray-600">Pusat fitur simulasi untuk membantu perhitungan harga, belanja, dan profit.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5" /> Simulasi Harga Jual
              </CardTitle>
              <CardDescription>Hitung harga jual ideal berdasarkan HPP, pajak, dan komisi channel.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/simulation/harga-jual" className="inline-flex items-center px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700">
                Buka Simulasi Harga Jual
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Kalkulator Belanja
              </CardTitle>
              <CardDescription>Rencanakan kebutuhan belanja dari beberapa resep sekaligus dan ekspor daftar.</CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/simulation/kalkulator-belanja" className="inline-flex items-center px-4 py-2 rounded-md bg-emerald-600 text-white hover:bg-emerald-700">
                Buka Kalkulator Belanja
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
