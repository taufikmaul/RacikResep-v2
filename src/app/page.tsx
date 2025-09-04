'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { 
  ChefHat, 
  Calculator, 
  TrendingUp, 
  Users, 
  CheckCircle, 
  Star, 
  ArrowRight,
  Zap,
  Shield,
  BarChart3,
  Package,
  Clock
} from 'lucide-react'

export default function Home() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)

  const features = [
    {
      icon: ChefHat,
      title: "Kelola Resep & Bahan",
      description: "Kelola semua resep dan bahan baku dengan sistem SKU otomatis dan kategorisasi yang mudah"
    },
    {
      icon: Calculator,
      title: "Kalkulasi Biaya Otomatis",
      description: "Hitung COGS, margin keuntungan, dan harga jual dengan kalkulasi yang akurat"
    },
    {
      icon: TrendingUp,
      title: "Simulasi Bisnis",
      description: "Simulasikan berbagai skenario harga dan analisis profitabilitas bisnis Anda"
    },
    {
      icon: Package,
      title: "Sistem SKU Cerdas",
      description: "Generate SKU otomatis dengan format yang dapat disesuaikan untuk setiap bisnis"
    },
    {
      icon: BarChart3,
      title: "Analisis & Laporan",
      description: "Dashboard lengkap dengan statistik bisnis dan aktivitas yang real-time"
    },
    {
      icon: Shield,
      title: "Keamanan Data",
      description: "Data bisnis Anda aman dengan sistem autentikasi yang kuat"
    }
  ]

  const plans = [
    {
      id: "starter",
      name: "Starter",
      price: 0,
      originalPrice: 99000,
      description: "Cocok untuk bisnis kecil yang baru memulai",
      features: [
        "Hingga 50 resep",
        "Hingga 200 bahan baku",
        "Kalkulasi biaya dasar",
        "Simulasi harga jual",
        "Sistem SKU otomatis",
        "Email support"
      ],
      popular: false
    },
    {
      id: "professional",
      name: "Professional",
      price: 99000,
      originalPrice: 99000,
      description: "Solusi lengkap untuk bisnis yang berkembang",
      features: [
        "Hingga 500 resep",
        "Hingga 2000 bahan baku",
        "Semua fitur Starter",
        "Analisis bisnis lanjutan",
        "Export data ke Excel/PDF",
        "Priority support",
        "Backup otomatis"
      ],
      popular: true
    },
    {
      id: "enterprise",
      name: "Enterprise",
      price: 199000,
      originalPrice: 199000,
      description: "Untuk bisnis besar dengan kebutuhan khusus",
      features: [
        "Resep & bahan unlimited",
        "Semua fitur Professional",
        "Multi-user access",
        "API access",
        "Custom integrations",
        "Dedicated support",
        "SLA guarantee"
      ],
      popular: false
    }
  ]

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Pemilik Cafe Kopi",
      content: "RacikResep membantu saya mengelola 50+ resep dengan mudah. Kalkulasi biaya yang akurat membuat pricing strategy saya lebih tepat.",
      rating: 5
    },
    {
      name: "Ahmad Rizki",
      role: "Chef Catering",
      content: "Sistem SKU otomatis sangat membantu tim saya. Sekarang inventory management jadi lebih efisien dan terorganisir.",
      rating: 5
    },
    {
      name: "Maya Sari",
      role: "Pemilik Bakery",
      content: "Simulasi harga jual membantu saya menentukan margin yang tepat. Profit bisnis meningkat 30% dalam 3 bulan pertama.",
      rating: 5
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10"></div>
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm">
              🎉 14 Hari Trial Gratis • Tidak Perlu Kartu Kredit
            </Badge>
            
            <h1 className="text-5xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Kelola Resep & Bisnis
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {" "}Lebih Cerdas
              </span>
            </h1>
            
            <p className="text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed">
              Platform lengkap untuk mengelola resep, kalkulasi biaya, dan analisis bisnis kuliner. 
              Mulai dengan trial gratis 14 hari tanpa komitmen.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link href="/auth/signup">
                <Button size="lg" className="px-8 py-4 text-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                  Mulai Trial Gratis
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/auth/signin">
                <Button variant="outline" size="lg" className="px-8 py-4 text-lg">
                  Sudah Punya Akun? Login
                </Button>
              </Link>
            </div>
            
            <p className="text-sm text-gray-500 mt-4">
              ✨ 500+ bisnis kuliner sudah mempercayai RacikResep
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Fitur Lengkap untuk Bisnis Kuliner
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Semua yang Anda butuhkan untuk mengelola bisnis kuliner dari satu platform yang mudah digunakan
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                <CardHeader className="text-center pb-4">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <CardDescription className="text-base text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Pilih Plan yang Tepat
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Mulai dengan trial gratis 14 hari. Pilih plan yang sesuai dengan kebutuhan bisnis Anda
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <Card 
                key={plan.id} 
                className={`relative border-2 transition-all duration-300 hover:shadow-xl ${
                  plan.popular 
                    ? 'border-blue-500 shadow-xl scale-105' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-blue-500 text-white px-4 py-2">
                      <Star className="h-4 w-4 mr-1" />
                      Paling Populer
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                  <CardDescription className="text-base">{plan.description}</CardDescription>
                  
                  <div className="mt-6">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl font-bold text-gray-900">
                        {plan.price === 0 ? 'Gratis' : `Rp ${plan.price.toLocaleString('id-ID')}`}
                      </span>
                      {plan.price === 0 && (
                        <span className="text-lg text-gray-500 line-through">
                          Rp {plan.originalPrice.toLocaleString('id-ID')}
                        </span>
                      )}
                    </div>
                    {plan.price > 0 && (
                      <p className="text-sm text-gray-500 mt-1">per bulan</p>
                    )}
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  <ul className="space-y-3">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <div className="pt-6">
                    {plan.price === 0 ? (
                      <Link href="/auth/signup" className="w-full">
                        <Button className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700">
                          <Clock className="h-4 w-4 mr-2" />
                          Mulai Trial 14 Hari
                        </Button>
                      </Link>
                    ) : (
                      <Link href="/auth/signup" className="w-full">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                          <Zap className="h-4 w-4 mr-2" />
                          Pilih Plan Ini
                        </Button>
                      </Link>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              Semua plan termasuk trial gratis 14 hari • Tidak ada komitmen jangka panjang
            </p>
            <Link href="/auth/signup">
              <Button variant="outline" size="lg">
                Lihat Semua Fitur
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Apa Kata Mereka
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Lihat bagaimana RacikResep membantu bisnis kuliner berkembang
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                <CardContent className="p-6">
                  <div className="flex items-center mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  
                  <blockquote className="text-gray-700 mb-6 italic">
                    &ldquo;{testimonial.content}&rdquo;
                  </blockquote>
                  
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                      <Users className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-600">{testimonial.role}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold text-white mb-6">
            Siap Memulai?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Bergabunglah dengan ratusan bisnis kuliner yang sudah menggunakan RacikResep. 
            Mulai trial gratis Anda hari ini!
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link href="/auth/signup">
              <Button size="lg" className="px-8 py-4 text-lg bg-white text-blue-600 hover:bg-gray-100">
                Mulai Trial Gratis Sekarang
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/auth/signin">
              <Button variant="outline" size="lg" className="px-8 py-4 text-lg border-white text-white hover:bg-white hover:text-blue-600">
                Login ke Akun
              </Button>
            </Link>
          </div>
          
          <p className="text-blue-200 mt-6 text-sm">
            ⚡ Setup dalam 2 menit • 📱 Responsive di semua device • 🔒 Data 100% aman
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">RacikResep</h3>
              <p className="text-gray-400">
                Platform lengkap untuk mengelola bisnis kuliner dengan mudah dan efisien.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Produk</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/features" className="hover:text-white transition-colors">Fitur</Link></li>
                <li><Link href="/pricing" className="hover:text-white transition-colors">Harga</Link></li>
                <li><Link href="/trial" className="hover:text-white transition-colors">Trial Gratis</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Dukungan</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/help" className="hover:text-white transition-colors">Pusat Bantuan</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">Kontak</Link></li>
                <li><Link href="/docs" className="hover:text-white transition-colors">Dokumentasi</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">Perusahaan</h4>
              <ul className="space-y-2 text-gray-400">
                <li><Link href="/about" className="hover:text-white transition-colors">Tentang Kami</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">Privasi</Link></li>
                <li><Link href="/terms" className="hover:text-white transition-colors">Syarat & Ketentuan</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 RacikResep. Semua hak dilindungi.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
