'use client'

import { useSession } from 'next-auth/react'
import { useEffect, useState } from 'react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, ChefHat, TrendingUp, Activity } from 'lucide-react'

interface DashboardStats {
  totalIngredients: number
  totalRecipes: number
  averageProfitMargin: number
  recentActivities: Array<{
    id: string
    action: string
    description: string
    createdAt: string
  }>
  topRecipes: Array<{
    id: string
    name: string
    profitMargin: number
    cogsPerServing: number
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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {[...Array(4)].map((_, i) => (
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
        <div>
          <h1 className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>Dashboard</h1>
          <p style={{ color: "var(--gray-11)" }}>Selamat datang kembali, {session?.user?.name}!</p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bahan Baku</CardTitle>
              <Package className="h-4 w-4" style={{ color: "var(--blue-9)" }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalIngredients || 0}</div>
              <p className="text-xs" style={{ color: "var(--gray-10)" }}>bahan tersedia</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Resep</CardTitle>
              <ChefHat className="h-4 w-4" style={{ color: "var(--green-9)" }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalRecipes || 0}</div>
              <p className="text-xs" style={{ color: "var(--gray-10)" }}>resep dibuat</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Rata-rata Margin</CardTitle>
              <TrendingUp className="h-4 w-4" style={{ color: "var(--purple-9)" }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.averageProfitMargin?.toFixed(1) || 0}%</div>
              <p className="text-xs" style={{ color: "var(--gray-10)" }}>keuntungan</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktivitas</CardTitle>
              <Activity className="h-4 w-4" style={{ color: "var(--orange-9)" }} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.recentActivities?.length || 0}</div>
              <p className="text-xs" style={{ color: "var(--gray-10)" }}>aktivitas terbaru</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Most Profitable Recipes */}
          <Card>
            <CardHeader>
              <CardTitle>Resep Paling Menguntungkan</CardTitle>
              <CardDescription>
                Daftar resep dengan margin keuntungan tertinggi
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.topRecipes?.length ? (
                <div className="space-y-4">
                  {stats.topRecipes.map((recipe) => (
                    <div key={recipe.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{recipe.name}</p>
                        <p className="text-sm" style={{ color: "var(--gray-11)" }}>
                          COGS: Rp {recipe.cogsPerServing.toLocaleString('id-ID')}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium" style={{ color: "var(--green-11)" }}>
                          {recipe.profitMargin.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4" style={{ color: "var(--gray-10)" }}>
                  Belum ada resep. Mulai buat resep pertama Anda!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Recent Activities */}
          <Card>
            <CardHeader>
              <CardTitle>Aktivitas Terbaru</CardTitle>
              <CardDescription>
                5 aktivitas terakhir yang Anda lakukan
              </CardDescription>
            </CardHeader>
            <CardContent>
              {stats?.recentActivities?.length ? (
                <div className="space-y-4">
                  {stats.recentActivities.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3">
                      <div className="w-2 h-2 rounded-full mt-2" style={{ background: "var(--accent-9)" }}></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">{activity.action}</p>
                        <p className="text-sm" style={{ color: "var(--gray-11)" }}>{activity.description}</p>
                        <p className="text-xs" style={{ color: "var(--gray-10)" }}>
                          {new Date(activity.createdAt).toLocaleDateString('id-ID')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-4" style={{ color: "var(--gray-10)" }}>
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
