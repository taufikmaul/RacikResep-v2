'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  Package, 
  ChefHat, 
  TrendingUp, 
  Activity, 
  Layers, 
  Store, 
  DollarSign,
  BarChart3,
  Target,
  AlertTriangle,
  Plus,
  PieChart
} from 'lucide-react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  LineChart,
  Line,
  Pie
} from 'recharts'
import { SALES_CHANNEL_ICONS } from '@/components/ui/sales-channel-icon-selector'

interface DashboardStats {
  // Basic counts
  totalIngredients: number
  totalRecipes: number
  basicRecipes: number
  favoriteRecipes: number
  totalCategories: number
  totalSalesChannels: number
  
  // Financial metrics
  totalCOGS: number
  totalPotentialRevenue: number
  averageProfitMargin: number
  averageCOGS: number
  averageRecipeComplexity: number
  
  // Top performers
  topRecipes: Array<{
    id: string
    name: string
    profitMargin: number
    cogsPerServing: number
    sellingPrice: number
    totalCOGS: number
  }>
  mostExpensiveRecipes: Array<{
    id: string
    name: string
    totalCOGS: number
    cogsPerServing: number
    yield: number
  }>
  
  // Category data
  categoryBreakdown: Array<{
    id: string
    name: string
    color: string
    recipeCount: number
    ingredientCount: number
  }>
  
  // Distribution data
  profitMarginRanges: {
    low: number
    medium: number
    high: number
  }
  
  // Recent activities
  recentActivities: Array<{
    id: string
    action: string
    description: string
    createdAt: string
  }>
  
  // Ingredient usage
  mostUsedIngredients: Array<{
    id: string
    name: string
    unit: string
    recipeCount: number
    totalQuantity: number
  }>
  leastUsedIngredients: Array<{
    id: string
    name: string
    unit: string
    recipeCount: number
    totalQuantity: number
  }>
  
  // Sales channels
  salesChannels: Array<{
    id: string
    name: string
    commission: number
    icon: string
  }>
}

export default function Dashboard() {
  const { data: session } = useSession()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/dashboard/stats')
        if (response.ok) {
          const data = await response.json()
          setStats(data)
        }
      } catch (error) {
        console.error('Error fetching dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    if (session) {
      fetchStats()
    }
  }, [session])

  // Prepare chart data
  const profitMarginData = [
    { name: 'Low (<20%)', value: stats?.profitMarginRanges.low || 0, color: '#ef4444' },
    { name: 'Medium (20-40%)', value: stats?.profitMarginRanges.medium || 0, color: '#f59e0b' },
    { name: 'High (>40%)', value: stats?.profitMarginRanges.high || 0, color: '#10b981' }
  ]

  const categoryData = stats?.categoryBreakdown.map(cat => ({
    name: cat.name,
    recipes: cat.recipeCount,
    ingredients: cat.ingredientCount,
    color: cat.color
  })) || []

  const topRecipesData = stats?.topRecipes.map(recipe => ({
    name: recipe.name.length > 15 ? recipe.name.substring(0, 15) + '...' : recipe.name,
    profit: recipe.profitMargin,
    cogs: recipe.cogsPerServing
  })) || []

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded"></div>
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
        {/* Header with Quick Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: "var(--gray-12)" }}>
              Dashboard
            </h1>
            <p style={{ color: "var(--gray-11)" }}>
              Selamat datang kembali, {session?.user?.name}!
            </p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Tambah Resep
            </Button>
            <Button size="sm" variant="outline" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Tambah Bahan
            </Button>
          </div>
        </div>

        {/* Enhanced Stats Cards - Row 1 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {/* Basic Stats */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bahan Baku</CardTitle>
              <Package className="h-4 w-4" style={{ color: "var(--blue-9)" }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalIngredients || 0}</div>
              <p className="text-xs" style={{ color: "var(--gray-10)" }}>
                {stats?.totalCategories || 0} kategori
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resep</CardTitle>
              <ChefHat className="h-4 w-4" style={{ color: "var(--green-9)" }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRecipes || 0}</div>
              <p className="text-xs" style={{ color: "var(--gray-10)" }}>
                {stats?.basicRecipes || 0} basic recipes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata Margin</CardTitle>
              <TrendingUp className="h-4 w-4" style={{ color: "var(--purple-9)" }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageProfitMargin?.toFixed(1) || 0}%</div>
              <p className="text-xs" style={{ color: "var(--gray-10)" }}>
                {stats?.favoriteRecipes || 0} favorit
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total COGS</CardTitle>
              <DollarSign className="h-4 w-4" style={{ color: "var(--orange-9)" }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {(stats?.totalCOGS || 0).toLocaleString('id-ID')}
              </div>
              <p className="text-xs" style={{ color: "var(--gray-10)" }}>
                Rp {(stats?.averageCOGS || 0).toLocaleString('id-ID')} rata-rata
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Stats Cards - Row 2 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Basic Recipes</CardTitle>
              <Layers className="h-4 w-4" style={{ color: "var(--indigo-9)" }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.basicRecipes || 0}</div>
              <p className="text-xs" style={{ color: "var(--gray-10)" }}>
                dapat digunakan sebagai bahan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Sales Channels</CardTitle>
              <Store className="h-4 w-4" style={{ color: "var(--teal-9)" }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalSalesChannels || 0}</div>
              <p className="text-xs" style={{ color: "var(--gray-10)" }}>
                channel penjualan
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Kompleksitas</CardTitle>
              <BarChart3 className="h-4 w-4" style={{ color: "var(--pink-9)" }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageRecipeComplexity?.toFixed(1) || 0}</div>
              <p className="text-xs" style={{ color: "var(--gray-10)" }}>
                bahan per resep
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potensi Revenue</CardTitle>
              <Target className="h-4 w-4" style={{ color: "var(--emerald-9)" }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Rp {(stats?.totalPotentialRevenue || 0).toLocaleString('id-ID')}
              </div>
              <p className="text-xs" style={{ color: "var(--gray-10)" }}>
                jika semua resep terjual
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Profit Margin Distribution Pie Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChart className="h-5 w-5" />
                Distribusi Profit Margin
              </CardTitle>
              <CardDescription>
                Sebaran resep berdasarkan margin keuntungan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={profitMarginData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {profitMarginData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value, name) => [`${value} resep`, name]}
                      labelStyle={{ color: '#374151' }}
                    />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {profitMarginData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    ></div>
                    <span className="text-sm">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Top Recipes Performance Bar Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Top 5 Resep Paling Menguntungkan
              </CardTitle>
              <CardDescription>
                Resep dengan margin keuntungan tertinggi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topRecipesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tick={{ fontSize: 12 }}
                      label={{ value: 'Margin (%)', angle: -90, position: 'insideLeft' }}
                    />
                    <Tooltip 
                      formatter={(value) => [`${value}%`, 'Profit Margin']}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Bar dataKey="profit" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* COGS vs Profit Analysis */}
        {stats?.topRecipes && stats.topRecipes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Analisis COGS vs Profit Margin
              </CardTitle>
              <CardDescription>
                Hubungan antara biaya produksi dan margin keuntungan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={topRecipesData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 12 }}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      tick={{ fontSize: 12 }}
                      label={{ value: 'COGS (Rp)', angle: 90, position: 'insideRight' }}
                    />
                    <Tooltip 
                      formatter={(value, dataKey) => [
                        dataKey === 'profit' ? `${value}%` : `Rp ${value?.toLocaleString('id-ID')}`,
                        dataKey === 'profit' ? 'Profit Margin' : 'COGS per Unit'
                      ]}
                      labelStyle={{ color: '#374151' }}
                    />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="profit" 
                      stroke="#10b981" 
                      strokeWidth={3}
                      dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="cogs" 
                      stroke="#ef4444" 
                      strokeWidth={3}
                      dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-green-500"></div>
                  <span className="text-sm">Profit Margin (%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-0.5 bg-red-500"></div>
                  <span className="text-sm">COGS per Unit (Rp)</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ingredient Usage Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Analisis Penggunaan Bahan
            </CardTitle>
            <CardDescription>
              Bahan yang paling sering dan jarang digunakan dalam resep
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Most Used Ingredients */}
              <div>
                <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Paling Sering Digunakan
                </h4>
                <div className="space-y-2">
                  {stats?.mostUsedIngredients && stats.mostUsedIngredients.length > 0 ? (
                    stats.mostUsedIngredients.map((ingredient, index) => (
                      <div key={ingredient.id} className="flex items-center justify-between p-3 rounded-lg border border-green-100 bg-green-50">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-green-800">{ingredient.name}</p>
                            <p className="text-sm text-green-600">
                              {ingredient.totalQuantity.toFixed(1)} {ingredient.unit}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-700">
                            {ingredient.recipeCount}
                          </div>
                          <div className="text-xs text-green-600">resep</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Belum ada data penggunaan bahan</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Least Used Ingredients */}
              <div>
                <h4 className="font-semibold text-orange-700 mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Jarang Digunakan
                </h4>
                <div className="space-y-2">
                  {stats?.leastUsedIngredients && stats.leastUsedIngredients.length > 0 ? (
                    stats.leastUsedIngredients.map((ingredient, index) => (
                      <div key={ingredient.id} className="flex items-center justify-between p-3 rounded-lg border border-orange-100 bg-orange-50">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-bold flex items-center justify-center">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-orange-800">{ingredient.name}</p>
                            <p className="text-sm text-orange-600">
                              {ingredient.totalQuantity.toFixed(1)} {ingredient.unit}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-orange-700">
                            {ingredient.recipeCount}
                          </div>
                          <div className="text-xs text-orange-600">resep</div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Belum ada data penggunaan bahan</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sales Channels Overview */}
        {stats?.salesChannels && stats.salesChannels.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" />
                Saluran Penjualan
              </CardTitle>
              <CardDescription>
                Platform penjualan yang dikonfigurasi
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {stats.salesChannels.map((channel) => {
                  const channelIcon = SALES_CHANNEL_ICONS.find(icon => icon.id === channel.icon) || SALES_CHANNEL_ICONS.find(icon => icon.id === 'other')
                  return (
                    <div key={channel.id} className="flex items-center gap-3 p-3 rounded-lg border">
                      <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
                        style={{ backgroundColor: channelIcon?.color || '#6B7280' }}
                      >
                        {channelIcon?.icon || '🏢'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-900 truncate">{channel.name}</p>
                        <p className="text-sm text-gray-500">Komisi: {channel.commission}%</p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Category Breakdown with Chart */}
        {stats?.categoryBreakdown && stats.categoryBreakdown.length > 0 && (
          <div className="grid gap-6 md:grid-cols-2">
            {/* Category Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Distribusi Kategori
                </CardTitle>
                <CardDescription>
                  Jumlah resep per kategori
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={categoryData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        tick={{ fontSize: 12 }}
                        angle={-45}
                        textAnchor="end"
                        height={80}
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        label={{ value: 'Jumlah Resep', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [`${value}`, 'Resep']}
                        labelStyle={{ color: '#374151' }}
                      />
                      <Bar dataKey="recipes" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Category List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="h-5 w-5" />
                  Detail Kategori
                </CardTitle>
                <CardDescription>
                  Resep dan bahan per kategori
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.categoryBreakdown.map((category) => (
                    <div key={category.id} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: category.color }}
                        ></div>
                        <div>
                          <p className="font-medium">{category.name}</p>
                          <p className="text-sm text-gray-500">
                            {category.recipeCount} resep • {category.ingredientCount} bahan
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-blue-600">
                          {category.recipeCount}
                        </div>
                        <div className="text-xs text-gray-500">resep</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Bottom Row - Lists */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Most Expensive Recipes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5" />
                Resep Termahal (by COGS)
              </CardTitle>
              <CardDescription>
                Resep dengan biaya produksi tertinggi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.mostExpensiveRecipes?.length ? (
                <div className="space-y-4">
                  {stats.mostExpensiveRecipes.map((recipe) => (
                    <div key={recipe.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{recipe.name}</p>
                        <p className="text-sm text-gray-500">
                          Yield: {recipe.yield} • COGS/Unit: Rp {recipe.cogsPerServing.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-red-600">
                          Rp {recipe.totalCOGS.toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">
                  Belum ada data resep
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Aktivitas Terbaru
                  </CardTitle>
                  <CardDescription>
                    5 aktivitas terakhir yang Anda lakukan
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/settings/activity-log'}
                  className="flex items-center gap-1"
                >
                  Lihat Semua
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {stats?.recentActivities?.length ? (
                <div className="space-y-4">
                  {stats.recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full mt-2 bg-blue-500"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-sm text-gray-500">{activity.description}</p>
                        <p className="text-xs text-gray-400">
                          {new Date(activity.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4 text-gray-500">
                  Belum ada aktivitas
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}