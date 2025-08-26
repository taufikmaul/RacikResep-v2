"use client"

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

type CollapsibleContextValue = {
  open: boolean
  setOpen: (v: boolean) => void
}

const CollapsibleContext = React.createContext<CollapsibleContextValue | null>(null)

export function Collapsible({
  children,
  defaultOpen,
  asChild,
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div"> & { defaultOpen?: boolean; asChild?: boolean }) {
  const [open, setOpen] = React.useState(!!defaultOpen)
  const Comp: any = asChild ? Slot : 'div'
  return (
    <CollapsibleContext.Provider value={{ open, setOpen }}>
      <Comp data-state={open ? 'open' : 'closed'} className={className} {...props}>
        {children}
      </Comp>
    </CollapsibleContext.Provider>
  )
}

export function CollapsibleTrigger({ asChild, children, ...props }: React.ComponentPropsWithoutRef<"button"> & { asChild?: boolean }) {
  const ctx = React.useContext(CollapsibleContext)
  if (!ctx) throw new Error("CollapsibleTrigger must be used within Collapsible")
  const Comp: any = asChild ? Slot : 'button'
  return (
    <Comp {...props} onClick={(e: any) => { props.onClick?.(e as any); ctx.setOpen(!ctx.open) }}>
      {children}
    </Comp>
  )
}

export function CollapsibleContent({ children, ...props }: React.ComponentPropsWithoutRef<"div">) {
  const ctx = React.useContext(CollapsibleContext)
  if (!ctx) throw new Error("CollapsibleContent must be used within Collapsible")
  if (!ctx.open) return null
  return (
    <div {...props}>{children}</div>
  )
}
