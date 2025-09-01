'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import {
  LogOut,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  useSidebar,
} from '@/components/ui/sidebar'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

type NavItem = 
  | { href: string; label: string; icon: string }
  | { key: string; label: string; icon: string; submenu: { href: string; label: string }[] }

export function AppSidebar() {
  const { data: session } = useSession()
  const pathname = usePathname()
  const [bizInfo, setBizInfo] = useState<{ name: string; address?: string; logo?: string } | null>(null)
  const [expandedMenus, setExpandedMenus] = useState<string[]>([])
  const { collapsed } = useSidebar()

  useEffect(() => {
    // Fetch business info to display in Informasi Aplikasi
    const loadBiz = async () => {
      try {
        const res = await fetch('/api/business/profile')
        if (res.ok) {
          const data = await res.json()
          setBizInfo({ 
            name: data?.name ?? 'Bisnis', 
            address: data?.address ?? '', 
            logo: data?.logo
          })
        }
      } catch (_) {
        // Silent fail
      }
    }
    loadBiz()
  }, [])

  // Auto-expand simulation menu if user is on a simulation page
  useEffect(() => {
    if (pathname.startsWith('/simulation')) {
      setExpandedMenus(prev => prev.includes('simulation') ? prev : [...prev, 'simulation'])
    }
  }, [pathname])

  const navItems: NavItem[] = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/ingredients', label: 'Bahan Baku', icon: '🥬' },
    { href: '/recipes', label: 'Resep', icon: '📝' },
    { href: '/recipes/price-manager', label: 'Price Manager', icon: '💰' },
    {
      key: 'simulation',
      label: 'Simulasi',
      icon: '🧮',
      submenu: [
        { href: '/simulation/harga-jual', label: 'Simulasi Harga Jual' },
        { href: '/simulation/kalkulator-belanja', label: 'Kalkulator Belanja' }
      ]
    },
    { href: '/subscription', label: 'Subscription', icon: '👑' },
    { href: '/settings', label: 'Pengaturan', icon: '⚙️' }
  ]

  const toggleMenu = (key: string) => {
    setExpandedMenus(prev => 
      prev.includes(key) 
        ? prev.filter(k => k !== key)
        : [...prev, key]
    )
  }

  const isMenuExpanded = (key: string) => expandedMenus.includes(key)

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/')

  const hasSubmenu = (item: NavItem): item is { key: string; label: string; icon: string; submenu: { href: string; label: string }[] } => {
    return 'submenu' in item
  }

  return (
    <Sidebar>
      <SidebarContent>
        {/* Business Info */}
        <div className="flex items-center gap-3 p-4 border-b border-border">
          <div className="flex-shrink-0">
            {bizInfo?.logo ? (
              <img
                src={bizInfo.logo}
                alt="Business Logo"
                className="h-10 w-10 rounded-lg object-cover"
              />
            ) : (
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-accent to-accent/80 flex items-center justify-center text-white font-bold text-lg">
                {bizInfo?.name?.charAt(0) || 'B'}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-foreground truncate">
              {bizInfo?.name || 'Business Name'}
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              COGS & Pricing
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            if (hasSubmenu(item)) {
              // Submenu item
              const expanded = isMenuExpanded(item.key)
              const hasActiveChild = item.submenu.some(sub => isActive(sub.href))
              
              return (
                <div key={item.key}>
                  <button
                    onClick={() => toggleMenu(item.key)}
                    className={cn(
                      "w-full flex items-center justify-between gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                      hasActiveChild
                        ? "bg-accent text-accent-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    {expanded ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  
                  {expanded && (
                    <div className="ml-6 mt-1 space-y-1">
                      {item.submenu.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          className={cn(
                            "block px-3 py-2 rounded-lg text-sm transition-colors",
                            isActive(subItem.href)
                              ? "bg-accent/50 text-accent-foreground font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/25"
                          )}
                        >
                          {subItem.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            } else {
              // Regular menu item
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive(item.href)
                      ? "bg-accent text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <span className="text-lg">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              )
            }
          })}
        </nav>
      </SidebarContent>

      {/* User Section */}
      <SidebarFooter>
        <div className="p-4 border-t border-border">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center text-accent-foreground text-sm font-medium">
              {session?.user?.name?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">
                {session?.user?.name || 'User'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {session?.user?.email || 'user@example.com'}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => signOut()}
              className="text-muted-foreground hover:text-foreground hover:bg-accent/50"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
