"use client"

import * as React from "react"
import Link from "next/link"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

// Very lightweight Sidebar primitives inspired by shadcn/ui docs
// Provides: SidebarProvider, useSidebar, Sidebar, SidebarHeader, SidebarContent, SidebarFooter,
// SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarNavLink
// Extended to support shadcn NavMain API: SidebarGroup, SidebarGroupLabel, SidebarMenuSub,
// SidebarMenuSubItem, SidebarMenuSubButton

type SidebarContextValue = {
  collapsed: boolean
  setCollapsed: (v: boolean) => void
  toggle: () => void
}

const SidebarContext = React.createContext<SidebarContextValue | null>(null)

export function SidebarProvider({
  children,
  defaultCollapsed = false,
  collapsed: collapsedProp,
  onCollapsedChange,
}: {
  children: React.ReactNode
  defaultCollapsed?: boolean
  collapsed?: boolean
  onCollapsedChange?: (v: boolean) => void
}) {
  const [internal, setInternal] = React.useState(defaultCollapsed)
  const isControlled = typeof collapsedProp === "boolean"
  const collapsed = isControlled ? (collapsedProp as boolean) : internal
  const setCollapsed = (v: boolean) => {
    if (isControlled) onCollapsedChange?.(v)
    else setInternal(v)
  }
  const toggle = () => setCollapsed(!collapsed)
  const value = React.useMemo(() => ({ collapsed, setCollapsed, toggle }), [collapsed])
  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext)
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider")
  return ctx
}

export const Sidebar = React.forwardRef<HTMLElement, React.ComponentPropsWithoutRef<"aside"> & { width?: number | string }>(
  ({ className, style, width, ...props }, ref) => {
    const { collapsed } = useSidebar()
    return (
      <aside
        ref={ref}
        className={cn("h-full flex flex-col transition-[width] duration-200", className)}
        style={{ width: collapsed ? 64 : 256, ...style, background: 'var(--color-panel-solid)', borderRight: '1px solid var(--gray-6)' }}
        {...props}
      />
    )
  }
)
Sidebar.displayName = "Sidebar"

export const SidebarHeader = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-3 py-4 flex items-center justify-between", className)} style={{ borderColor: 'var(--gray-6)' }} {...props} />
  )
)
SidebarHeader.displayName = "SidebarHeader"

export const SidebarContent = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex-1 overflow-y-auto py-2", className)} {...props} />
  )
)
SidebarContent.displayName = "SidebarContent"

export const SidebarFooter = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("mt-auto px-3 py-3 border-t", className)} style={{ borderColor: 'var(--gray-6)' }} {...props} />
  )
)
SidebarFooter.displayName = "SidebarFooter"

export const SidebarMenu = React.forwardRef<HTMLUListElement, React.ComponentPropsWithoutRef<"ul">>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("space-y-0.5", className)} {...props} />
  )
)
SidebarMenu.displayName = "SidebarMenu"

export const SidebarMenuItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<"li">>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("list-none", className)} {...props} />
  )
)
SidebarMenuItem.displayName = "SidebarMenuItem"

export const SidebarMenuButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<"button"> & { asChild?: boolean; isActive?: boolean; tooltip?: string }
>(({ className, asChild, isActive, tooltip, ...props }, ref) => {
  const Comp: any = asChild ? Slot : 'button'
  return (
    <Comp
      ref={ref}
      className={cn(
        "w-full flex items-center gap-2 px-3 h-9 rounded-md text-sm transition-colors",
        isActive
          ? "bg-[var(--accent-4)] text-[var(--gray-12)]"
          : "hover:bg-[var(--gray-3)] text-[var(--gray-12)]",
        className
      )}
      title={tooltip}
      {...props}
    />
  )
})
SidebarMenuButton.displayName = "SidebarMenuButton"

// Group wrappers
export const SidebarGroup = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 py-2", className)} {...props} />
  )
)
SidebarGroup.displayName = 'SidebarGroup'

export const SidebarGroupLabel = React.forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<'div'>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("px-2 pb-1 text-[11px] font-medium tracking-wide uppercase text-[var(--gray-11)]", className)} {...props} />
  )
)
SidebarGroupLabel.displayName = 'SidebarGroupLabel'

// Sub menu primitives
export const SidebarMenuSub = React.forwardRef<HTMLUListElement, React.ComponentPropsWithoutRef<'ul'>>(
  ({ className, ...props }, ref) => (
    <ul ref={ref} className={cn("ml-6 mt-1 space-y-0.5", className)} {...props} />
  )
)
SidebarMenuSub.displayName = 'SidebarMenuSub'

export const SidebarMenuSubItem = React.forwardRef<HTMLLIElement, React.ComponentPropsWithoutRef<'li'>>(
  ({ className, ...props }, ref) => (
    <li ref={ref} className={cn("list-none", className)} {...props} />
  )
)
SidebarMenuSubItem.displayName = 'SidebarMenuSubItem'

export const SidebarMenuSubButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentPropsWithoutRef<'button'> & { asChild?: boolean; isActive?: boolean }
>(
  ({ className, asChild, isActive, ...props }, ref) => {
    const Comp: any = asChild ? Slot : 'button'
    return (
      <Comp
        ref={ref}
        className={cn(
          "w-full flex items-center gap-2 px-3 h-8 rounded-md text-sm transition-colors",
          isActive
            ? "bg-[var(--accent-4)] text-[var(--gray-12)]"
            : "hover:bg-[var(--gray-3)] text-[var(--gray-12)]",
          className
        )}
        {...props}
      />
    )
  }
)
SidebarMenuSubButton.displayName = 'SidebarMenuSubButton'

// Convenience NavLink using SidebarMenuButton with Next.js Link
export function SidebarNavLink({ href, children, isActive }: { href: string; children: React.ReactNode; isActive?: boolean }) {
  return (
    <SidebarMenuButton asChild isActive={!!isActive}>
      <Link href={href} className="flex items-center gap-2 h-full w-full text-left">
        {children}
      </Link>
    </SidebarMenuButton>
  )
}
