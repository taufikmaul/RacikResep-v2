"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  DashboardIcon,
  MixIcon,
  MixerVerticalIcon,
  GearIcon,
  MixerHorizontalIcon,
} from "@radix-ui/react-icons"
import { ThemeToggle } from '@/components/ui/theme-toggle'

const items = [
  { href: "/dashboard", label: "Home", Icon: DashboardIcon },
  { href: "/ingredients", label: "Bahan", Icon: MixIcon },
  { href: "/recipes", label: "Resep", Icon: MixerVerticalIcon },
  { href: "/recipes/price", label: "Price", Icon: MixerHorizontalIcon },
  { href: "/settings", label: "Pengaturan", Icon: GearIcon },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Bottom navigation"
      className="sm:hidden fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)]"
      style={{ background: "transparent" }}
    >
      <div
        className="mx-auto mb-3 max-w-md px-4"
      >
        <div
          className="w-full rounded-2xl shadow-lg backdrop-blur supports-[backdrop-filter]:bg-opacity-80"
          style={{ background: "var(--color-panel-translucent)", border: "1px solid var(--gray-6)" }}
        >
          <div className="relative grid grid-cols-5 gap-1 py-2">
            {items.map(({ href, label, Icon }) => {
              const active = pathname === href || pathname.startsWith(href + "/")
              return (
                <Link
                  href={href}
                  key={href}
                  className="flex flex-col items-center justify-center gap-1 py-2"
                  style={{ color: active ? "var(--accent-11)" : "var(--gray-11)" }}
                >
                  <Icon className="h-5 w-5" style={{ color: active ? "var(--accent-10)" : "var(--gray-10)" }} />
                  <span className="text-xs" style={{ color: active ? "var(--accent-10)" : "var(--gray-9)" }}>{label}</span>
                </Link>
              )
            })}
          </div>
          {/* subtle bottom bar to mimic screenshot */}
          <div className="px-8 pb-2">
            <div className="h-1 rounded-full" style={{ background: "var(--gray-7)" }} />
          </div>
        </div>
      </div>
    </nav>
  )
}
