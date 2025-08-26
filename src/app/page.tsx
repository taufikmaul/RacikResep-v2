'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChefHat, Calculator, TrendingUp, Users, Shield, Zap, ArrowRight, Star, CheckCircle, BarChart3, Package } from 'lucide-react'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()

  useEffect(() => {
    if (status === 'loading') return
    if (session) {
      router.push('/dashboard')
    }
  }, [session, status, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Memuat...</p>
        </div>
      </div>
    )
  }

  if (session) {
    return null // Will redirect to dashboard
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--color-background)" }}>
      {/* Header */}
      <header className="backdrop-blur-md shadow-sm sticky top-0 z-50" style={{ background: "var(--color-panel-translucent)", borderBottom: "1px solid var(--gray-6)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <div className="p-2 rounded-xl" style={{ background: "var(--accent-9)" }}>
                <ChefHat className="h-6 w-6 text-white" />
              </div>
              <h1 className="ml-3 text-2xl font-bold" style={{ color: "var(--accent-11)" }}>
                RacikResep
              </h1>
            </div>
            <div className="flex items-center space-x-3">
              <Link href="/auth/signin">
                <Button variant="ghost">Masuk</Button>
              </Link>
              <Link href="/auth/signup">
                <Button className="shadow-lg" style={{ background: "var(--accent-9)", color: "white" }}>
                  Daftar Gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center">
          <div className="mb-8">
            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium mb-4" style={{ background: "var(--accent-3)", color: "var(--accent-11)" }}>
              <Star className="w-4 h-4 mr-2" />
              Platform #1 untuk Bisnis F&B
            </span>
          </div>
          <h1 className="text-5xl font-bold sm:text-6xl md:text-7xl leading-tight" style={{ color: "var(--gray-12)" }}>
            Kelola Resep & Hitung
            <span style={{ color: "var(--accent-11)" }}> COGS </span>
            dengan Mudah
          </h1>
          <p className="mt-6 max-w-3xl mx-auto text-xl leading-relaxed" style={{ color: "var(--gray-11)" }}>
            Platform SaaS terdepan untuk pemilik bisnis F&B. Hitung Cost of Goods Sold (COGS) secara akurat, 
            kelola inventory, dan tentukan harga jual yang menguntungkan di berbagai platform penjualan.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup">
              <Button className="text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 flex items-center" style={{ background: "var(--accent-9)" }}>
                Mulai Gratis Sekarang
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" className="px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-200" style={{ borderColor: "var(--gray-7)", color: "var(--gray-12)" }}>
                Masuk ke Akun
              </Button>
            </Link>
          </div>
          <div className="mt-12 flex items-center justify-center space-x-8 text-sm" style={{ color: "var(--gray-10)" }}>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" style={{ color: "var(--green-9)" }} />
              Gratis 14 hari
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" style={{ color: "var(--green-9)" }} />
              Tanpa kartu kredit
            </div>
            <div className="flex items-center">
              <CheckCircle className="w-5 h-5 mr-2" style={{ color: "var(--green-9)" }} />
              Setup 5 menit
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-20">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4" style={{ color: "var(--gray-12)" }}>
              Semua yang Anda butuhkan untuk mengelola resep dan menghitung keuntungan
            </h2>
            <p className="text-xl max-w-2xl mx-auto" style={{ color: "var(--gray-11)" }}>
              Fitur lengkap yang dirancang khusus untuk bisnis F&B modern
            </p>
          </div>

          <div className="mt-12 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader>
                <Package className="h-8 w-8" style={{ color: "var(--blue-9)" }} />
                <CardTitle className="text-lg">Manajemen Bahan Baku</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Kelola inventori bahan baku dengan kategorisasi dan perhitungan biaya per unit otomatis
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <ChefHat className="h-8 w-8" style={{ color: "var(--green-9)" }} />
                <CardTitle className="text-lg">Manajemen Resep</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Buat resep dengan komposisi dinamis dan hitung COGS secara real-time
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Calculator className="h-8 w-8" style={{ color: "var(--purple-9)" }} />
                <CardTitle className="text-lg">Simulasi Harga</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Simulasi promo dan hitung harga jual optimal untuk berbagai channel penjualan
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <BarChart3 className="h-8 w-8" style={{ color: "var(--orange-9)" }} />
                <CardTitle className="text-lg">Dashboard & Laporan</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Monitor performa bisnis dengan dashboard interaktif dan laporan detail
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-20 rounded-2xl" style={{ background: "var(--accent-9)" }}>
          <div className="px-6 py-12 sm:px-12 sm:py-16 lg:px-16">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-white">
                Siap Meningkatkan Profitabilitas Bisnis Anda?
              </h2>
              <p className="mt-4 text-lg" style={{ color: "var(--accent-3)" }}>
                Bergabung dengan ribuan pemilik bisnis F&B yang sudah merasakan manfaatnya
              </p>
              <div className="mt-8">
                <Link href="/auth/signup">
                  <Button size="lg" variant="secondary">
                    Daftar Gratis Sekarang
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ background: "var(--color-panel-solid)", borderTop: "1px solid var(--gray-6)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="flex items-center justify-center">
              <ChefHat className="h-6 w-6" style={{ color: "var(--accent-9)" }} />
              <span className="ml-2 text-lg font-semibold" style={{ color: "var(--gray-12)" }}>RacikResep</span>
            </div>
            <p className="mt-2 text-sm" style={{ color: "var(--gray-11)" }}>
              Platform SaaS untuk mengelola resep dan menghitung COGS bisnis F&B
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
