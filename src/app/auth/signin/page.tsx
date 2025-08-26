'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChefHat, Loader2, Eye, EyeOff } from 'lucide-react'

export default function SignIn() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      } else {
        router.push('/dashboard')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8" style={{ background: "var(--color-background)" }}>
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <div className="p-3 rounded-2xl shadow-lg" style={{ background: "var(--accent-9)" }}>
              <ChefHat className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-4xl font-bold" style={{ color: "var(--accent-11)" }}>
            RacikResep
          </h1>
          <p className="mt-3 text-lg" style={{ color: "var(--gray-11)" }}>
            Kelola resep dan hitung COGS dengan mudah
          </p>
        </div>
        
        <Card className="shadow-xl border-0 backdrop-blur-sm" style={{ background: "var(--color-panel-translucent)" }}>
          <CardHeader className="text-center pb-8">
            <CardTitle className="text-2xl font-bold" style={{ color: "var(--gray-12)" }}>Masuk ke Akun Anda</CardTitle>
            <CardDescription className="mt-2" style={{ color: "var(--gray-11)" }}>
              Masukkan email dan password untuk mengakses dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="px-4 py-3 rounded-lg text-sm flex items-center" style={{ background: "var(--red-3)", border: "1px solid var(--red-6)", color: "var(--red-11)" }}>
                  <div className="w-2 h-2 rounded-full mr-3" style={{ background: "var(--red-9)" }}></div>
                  {error}
                </div>
              )}
              
              <div>
                <label htmlFor="email" className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-12)" }}>
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="nama@email.com"
                  className="h-12 px-4 border-2 rounded-lg transition-colors" style={{ borderColor: "var(--gray-7)" }}
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-semibold mb-2" style={{ color: "var(--gray-12)" }}>
                  Password
                </label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Masukkan password"
                    className="h-12 px-4 pr-12 border-2 rounded-lg transition-colors" style={{ borderColor: "var(--gray-7)" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 transition-colors" style={{ color: "var(--gray-10)" }}
                  >
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-200" style={{ background: "var(--accent-9)" }} 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Memproses...
                  </>
                ) : (
                  'Masuk ke Dashboard'
                )}
              </Button>
            </form>
            
            <div className="mt-8 text-center">
              <p style={{ color: "var(--gray-11)" }}>
                Belum punya akun?{' '}
                <Link href="/auth/signup" className="font-semibold transition-colors" style={{ color: "var(--accent-11)" }}>
                  Daftar sekarang
                </Link>
              </p>
              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--gray-6)" }}>
                <Link href="/" className="text-sm transition-colors" style={{ color: "var(--gray-10)" }}>
                  ← Kembali ke beranda
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
