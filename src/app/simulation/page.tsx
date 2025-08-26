'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Calculator, Percent, TrendingUp, ShoppingCart, Target } from 'lucide-react'

interface Recipe {
  id: string
  name: string
  cogsPerServing: number
  basePrice: number
  profitMargin: number
}

interface SalesChannel {
  id: string
  name: string
  commission: number
}

interface PricingSimulation {
  recipeId: string
  targetMargin: number
  taxRate: number
  channels: Array<{
    channelId: string
    customPrice?: number
  }>
}

export default function SimulationPage() {
  const { data: session } = useSession()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [salesChannels, setSalesChannels] = useState<SalesChannel[]>([])
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [simulation, setSimulation] = useState<PricingSimulation>({
    recipeId: '',
    targetMargin: 30,
    taxRate: 11,
    channels: []
  })
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session) {
      fetchData()
    }
  }, [session])

  useEffect(() => {
    if (selectedRecipe) {
      setSimulation(prev => ({
        ...prev,
        recipeId: selectedRecipe.id,
        channels: salesChannels.map(channel => ({
          channelId: channel.id,
          customPrice: undefined
        }))
      }))
    }
  }, [selectedRecipe, salesChannels])

  const fetchData = async () => {
    try {
      const [recipesRes, channelsRes] = await Promise.all([
        fetch('/api/recipes'),
        fetch('/api/sales-channels')
      ])

      if (recipesRes.ok && channelsRes.ok) {
        const recipesJson = await recipesRes.json()
        const channelsData = await channelsRes.json()
        // API returns { data: Recipe[], pagination: {...} }
        const recipesData = Array.isArray(recipesJson) ? recipesJson : (recipesJson?.data ?? [])

        setRecipes(recipesData.map((r: any) => ({
          id: r.id,
          name: r.name,
          cogsPerServing: r.cogsPerServing,
          basePrice: r.basePrice,
          profitMargin: r.profitMargin
        })))
        setSalesChannels(channelsData)
      }
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateOptimalPrice = () => {
    if (!selectedRecipe) return 0
    const targetPrice = selectedRecipe.cogsPerServing / (1 - simulation.targetMargin / 100)
    return targetPrice * (1 + simulation.taxRate / 100)
  }

  const calculateChannelPrice = (channelId: string, basePrice?: number) => {
    const channel = salesChannels.find(c => c.id === channelId)
    if (!channel) return 0
    
    const price = basePrice || calculateOptimalPrice()
    return price / (1 - channel.commission / 100)
  }

  const calculatePromoPrice = (originalPrice: number) => {
    return originalPrice * (1 - promoDiscount / 100)
  }

  const calculateActualMargin = (sellingPrice: number) => {
    if (!selectedRecipe) return 0
    const totalCost = selectedRecipe.cogsPerServing * (1 + simulation.taxRate / 100)
    return ((sellingPrice - totalCost) / sellingPrice) * 100
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
          <h1 className="text-2xl font-bold text-gray-900">Simulasi Harga</h1>
          <p className="text-gray-600">Simulasi harga jual optimal dan analisis profitabilitas</p>
        </div>

        {/* Recipe Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Pilih Resep untuk Simulasi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <select
              value={selectedRecipe?.id || ''}
              onChange={(e) => {
                const recipe = recipes.find(r => r.id === e.target.value)
                setSelectedRecipe(recipe || null)
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Pilih resep...</option>
              {recipes.map(recipe => (
                <option key={recipe.id} value={recipe.id}>
                  {recipe.name} - COGS: Rp {recipe.cogsPerServing.toLocaleString('id-ID')}
                </option>
              ))}
            </select>
          </CardContent>
        </Card>

        {selectedRecipe && (
          <>
            {/* Pricing Calculator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Kalkulator Harga Optimal
                </CardTitle>
                <CardDescription>
                  Hitung harga jual berdasarkan target margin keuntungan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Target Margin (%)
                    </label>
                    <Input
                      type="number"
                      value={simulation.targetMargin}
                      onChange={(e) => setSimulation(prev => ({
                        ...prev,
                        targetMargin: parseFloat(e.target.value) || 0
                      }))}
                      min="0"
                      max="100"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Pajak (%)
                    </label>
                    <Input
                      type="number"
                      value={simulation.taxRate}
                      onChange={(e) => setSimulation(prev => ({
                        ...prev,
                        taxRate: parseFloat(e.target.value) || 0
                      }))}
                      min="0"
                      max="100"
                    />
                  </div>

                  <div className="flex items-end">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Harga Optimal
                      </label>
                      <div className="text-2xl font-bold text-green-600">
                        Rp {calculateOptimalPrice().toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-medium text-blue-900 mb-2">Breakdown Harga:</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-blue-700">COGS:</span>
                      <div className="font-medium">Rp {selectedRecipe.cogsPerServing.toLocaleString('id-ID')}</div>
                    </div>
                    <div>
                      <span className="text-blue-700">Margin:</span>
                      <div className="font-medium">{simulation.targetMargin}%</div>
                    </div>
                    <div>
                      <span className="text-blue-700">Pajak:</span>
                      <div className="font-medium">{simulation.taxRate}%</div>
                    </div>
                    <div>
                      <span className="text-blue-700">Keuntungan:</span>
                      <div className="font-medium text-green-600">
                        Rp {(calculateOptimalPrice() - selectedRecipe.cogsPerServing * (1 + simulation.taxRate / 100)).toLocaleString('id-ID')}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sales Channel Pricing */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ShoppingCart className="h-5 w-5" />
                  Harga per Channel Penjualan
                </CardTitle>
                <CardDescription>
                  Simulasi harga jual di berbagai platform dengan komisi berbeda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {salesChannels.map(channel => {
                    const optimalPrice = calculateOptimalPrice()
                    const channelPrice = calculateChannelPrice(channel.id, optimalPrice)
                    const actualMargin = calculateActualMargin(optimalPrice)
                    
                    return (
                      <div key={channel.id} className="border rounded-lg p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:justify-between mb-3">
                          <div>
                            <h4 className="font-medium text-gray-900">{channel.name}</h4>
                            <p className="text-sm text-gray-500">Komisi: {channel.commission}%</p>
                          </div>
                          <div className="text-left sm:text-right">
                            <div className="text-lg font-semibold text-gray-900">
                              Rp {channelPrice.toLocaleString('id-ID')}
                            </div>
                            <div className="text-sm text-gray-500">
                              Margin: {actualMargin.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Harga Dasar:</span>
                            <div className="font-medium">Rp {optimalPrice.toLocaleString('id-ID')}</div>
                          </div>
                          <div>
                            <span className="text-gray-600">Komisi Platform:</span>
                            <div className="font-medium text-red-600">
                              Rp {(channelPrice - optimalPrice).toLocaleString('id-ID')}
                            </div>
                          </div>
                          <div>
                            <span className="text-gray-600">Diterima:</span>
                            <div className="font-medium text-green-600">
                              Rp {optimalPrice.toLocaleString('id-ID')}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Promo Simulation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Simulasi Promo
                </CardTitle>
                <CardDescription>
                  Analisis dampak diskon terhadap margin keuntungan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Diskon Promo (%)
                    </label>
                    <Input
                      type="number"
                      value={promoDiscount}
                      onChange={(e) => setPromoDiscount(parseFloat(e.target.value) || 0)}
                      min="0"
                      max="100"
                      placeholder="0"
                    />
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harga Normal:</span>
                      <span className="font-medium">Rp {calculateOptimalPrice().toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Harga Promo:</span>
                      <span className="font-medium text-orange-600">
                        Rp {calculatePromoPrice(calculateOptimalPrice()).toLocaleString('id-ID')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Margin Setelah Promo:</span>
                      <span className={`font-medium ${
                        calculateActualMargin(calculatePromoPrice(calculateOptimalPrice())) > 0 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {calculateActualMargin(calculatePromoPrice(calculateOptimalPrice())).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {promoDiscount > 0 && (
                  <div className="mt-6 p-4 bg-orange-50 rounded-lg">
                    <h4 className="font-medium text-orange-900 mb-2">Analisis Promo:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-orange-700">Potongan Harga:</span>
                        <div className="font-medium">
                          Rp {(calculateOptimalPrice() - calculatePromoPrice(calculateOptimalPrice())).toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div>
                        <span className="text-orange-700">Keuntungan Berkurang:</span>
                        <div className="font-medium">
                          {(simulation.targetMargin - calculateActualMargin(calculatePromoPrice(calculateOptimalPrice()))).toFixed(1)}%
                        </div>
                      </div>
                      <div>
                        <span className="text-orange-700">Status:</span>
                        <div className={`font-medium ${
                          calculateActualMargin(calculatePromoPrice(calculateOptimalPrice())) > 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {calculateActualMargin(calculatePromoPrice(calculateOptimalPrice())) > 0 ? 'Masih Untung' : 'Rugi'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </DashboardLayout>
  )
}
