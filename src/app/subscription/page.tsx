'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Crown,
  Calendar,
  CreditCard,
  Settings
} from 'lucide-react'
import Link from 'next/link'

interface Plan {
  id: string
  name: string
  description: string
  price: number
  currency: string
  interval: string
  features: string
  maxUsers: number
  maxRecipes: number
  maxIngredients: number
}

interface Subscription {
  id: string
  status: string
  currentPeriodStart: string
  currentPeriodEnd: string
  trialStart: string
  trialEnd: string
  plan: Plan
}

export default function SubscriptionPage() {
  const { data: session, status } = useSession()
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSubscription()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [status])

  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions')
      if (response.ok) {
        const data = await response.json()
        setSubscription(data)
      } else {
        setError('Failed to fetch subscription')
      }
    } catch {
      setError('Failed to fetch subscription')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'trial':
        return 'bg-blue-500'
      case 'active':
        return 'bg-green-500'
      case 'cancelled':
        return 'bg-red-500'
      case 'expired':
        return 'bg-gray-500'
      default:
        return 'bg-gray-500'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'trial':
        return 'Trial Aktif'
      case 'active':
        return 'Berlangganan Aktif'
      case 'cancelled':
        return 'Dibatalkan'
      case 'expired':
        return 'Kadaluarsa'
      default:
        return 'Tidak Diketahui'
    }
  }

  const getTrialProgress = () => {
    if (!subscription || subscription.status !== 'trial') return 0
    
    const trialStart = new Date(subscription.trialStart).getTime()
    const trialEnd = new Date(subscription.trialEnd).getTime()
    const now = new Date().getTime()
    
    const total = trialEnd - trialStart
    const elapsed = now - trialStart
    
    return Math.min(Math.max((elapsed / total) * 100, 0), 100)
  }

  const getDaysRemaining = () => {
    if (!subscription || subscription.status !== 'trial') return 0
    
    const trialEnd = new Date(subscription.trialEnd).getTime()
    const now = new Date().getTime()
    
    const diff = trialEnd - now
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (status === 'unauthenticated') {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Akses Ditolak</h1>
          <p className="text-gray-600 mb-6">
            Anda harus login untuk melihat halaman subscription.
          </p>
          <Link href="/auth/signin">
            <Button>Login</Button>
          </Link>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Terjadi Kesalahan</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={fetchSubscription}>Coba Lagi</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Subscription</h1>
          <p className="text-gray-600">
            Kelola subscription dan trial Anda
          </p>
        </div>

        {subscription ? (
          <div className="space-y-6">
            {/* Current Subscription Status */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-xl">Status Subscription</CardTitle>
                    <CardDescription>
                      {subscription.plan.name} • {subscription.plan.description}
                    </CardDescription>
                  </div>
                  <Badge className={`${getStatusColor(subscription.status)} text-white`}>
                    {getStatusText(subscription.status)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-3">Detail Plan</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Harga:</span>
                        <span className="font-medium">
                          Rp {subscription.plan.price.toLocaleString('id-ID')}/{subscription.plan.interval}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maksimal Resep:</span>
                        <span className="font-medium">{subscription.plan.maxRecipes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maksimal Bahan:</span>
                        <span className="font-medium">{subscription.plan.maxIngredients}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Maksimal User:</span>
                        <span className="font-medium">{subscription.plan.maxUsers}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-semibold mb-3">Periode</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Mulai:</span>
                        <span className="font-medium">
                          {new Date(subscription.currentPeriodStart).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Berakhir:</span>
                        <span className="font-medium">
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString('id-ID')}
                        </span>
                      </div>
                      {subscription.trialStart && (
                        <div className="flex justify-between">
                          <span>Trial Mulai:</span>
                          <span className="font-medium">
                            {new Date(subscription.trialStart).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      )}
                      {subscription.trialEnd && (
                        <div className="flex justify-between">
                          <span>Trial Berakhir:</span>
                          <span className="font-medium">
                            {new Date(subscription.trialEnd).toLocaleDateString('id-ID')}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Trial Progress */}
                {subscription.status === 'trial' && (
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">Progress Trial</h4>
                      <span className="text-sm text-gray-600">
                        {getDaysRemaining()} hari tersisa
                      </span>
                    </div>
                    <Progress value={getTrialProgress()} className="h-2" />
                    <p className="text-sm text-gray-600 mt-2">
                      Trial Anda akan berakhir dalam {getDaysRemaining()} hari
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Plan Features */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Fitur yang Tersedia</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  {JSON.parse(subscription.plan.features).map((feature: string, index: number) => (
                    <div key={index} className="flex items-center gap-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Aksi</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-4">
                  {subscription.status === 'trial' && (
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Upgrade ke Berbayar
                    </Button>
                  )}
                  <Button variant="outline">
                    <Settings className="h-4 w-4 mr-2" />
                    Kelola Subscription
                  </Button>
                  <Button variant="outline" className="text-red-600 border-red-600 hover:bg-red-50">
                    Batalkan Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <Crown className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Belum Ada Subscription
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Anda belum memiliki subscription aktif. Mulai dengan trial gratis 14 hari 
                untuk menikmati semua fitur RacikResep.
              </p>
              <Link href="/">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  <Clock className="h-4 w-4 mr-2" />
                  Mulai Trial Gratis
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
