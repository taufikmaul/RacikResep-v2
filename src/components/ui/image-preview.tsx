"use client"

import React, { useEffect, useRef, useState } from "react"
import { Modal } from "./modal"

interface ImagePreviewProps {
  isOpen: boolean
  onClose: () => void
  src: string
  alt?: string
  title?: string
}

export function ImagePreview({ isOpen, onClose, src, alt = "", title = "Preview" }: ImagePreviewProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [scale, setScale] = useState(1)
  const [tx, setTx] = useState(0)
  const [ty, setTy] = useState(0)
  const [isPanning, setIsPanning] = useState(false)
  const lastPos = useRef<{ x: number; y: number } | null>(null)
  const lastTouchDist = useRef<number | null>(null)
  const doubleTapRef = useRef<number>(0)

  // Reset on open/src change
  useEffect(() => {
    if (isOpen) {
      setScale(1)
      setTx(0)
      setTy(0)
      lastTouchDist.current = null
    }
  }, [isOpen, src])

  // Support both DOM TouchList and React.TouchList
  const touchAt = (touches: any, i: number): Touch | null => {
    if (!touches) return null
    if (typeof touches.item === 'function') return touches.item(i)
    return touches[i] ?? null
  }

  const getTouchDist = (touches: any) => {
    if (!touches || touches.length < 2) return 0
    const a = touchAt(touches, 0)
    const b = touchAt(touches, 1)
    if (!a || !b) return 0
    const dx = a.clientX - b.clientX
    const dy = a.clientY - b.clientY
    return Math.hypot(dx, dy)
  }

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault()
    const delta = -e.deltaY
    const factor = delta > 0 ? 1.1 : 0.9
    const next = Math.min(4, Math.max(1, scale * factor))
    setScale(next)
  }

  const onMouseDown: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (scale === 1) return
    setIsPanning(true)
    lastPos.current = { x: e.clientX, y: e.clientY }
  }
  const onMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
    if (!isPanning || !lastPos.current) return
    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    setTx((v) => v + dx)
    setTy((v) => v + dy)
    lastPos.current = { x: e.clientX, y: e.clientY }
  }
  const endPan = () => {
    setIsPanning(false)
    lastPos.current = null
  }

  const onTouchStart: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (e.touches.length === 1) {
      // double tap to zoom
      const now = Date.now()
      if (now - doubleTapRef.current < 300) {
        setScale((s) => (s === 1 ? 2 : 1))
        setTx(0)
        setTy(0)
      }
      doubleTapRef.current = now
    }
    if (e.touches.length === 2) {
      lastTouchDist.current = getTouchDist(e.touches)
    }
  }

  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault()
      const dist = getTouchDist(e.touches)
      const last = lastTouchDist.current || dist
      const factor = dist / last
      const next = Math.min(4, Math.max(1, scale * factor))
      setScale(next)
      lastTouchDist.current = dist
    } else if (e.touches.length === 1 && scale > 1) {
      const touch = e.touches[0]
      const prev = lastPos.current || { x: touch.clientX, y: touch.clientY }
      const dx = touch.clientX - prev.x
      const dy = touch.clientY - prev.y
      setTx((v) => v + dx)
      setTy((v) => v + dy)
      lastPos.current = { x: touch.clientX, y: touch.clientY }
    }
  }

  const onTouchEnd: React.TouchEventHandler<HTMLDivElement> = () => {
    lastPos.current = null
    if (scale <= 1) {
      setScale(1)
      setTx(0)
      setTy(0)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
      <div className="flex items-center justify-center p-4 select-none">
        <div
          ref={containerRef}
          className="overflow-hidden touch-pan-y"
          style={{ maxHeight: "80vh", maxWidth: "100%" }}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={endPan}
          onMouseLeave={endPan}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="block max-w-full max-h-[80vh]"
            style={{ transform: `translate(${tx}px, ${ty}px) scale(${scale})`, transformOrigin: "center center" }}
          />
        </div>
      </div>
    </Modal>
  )
}
