'use client'

import { Toaster } from 'react-hot-toast'

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'var(--color-panel-translucent)',
          backdropFilter: 'blur(12px)',
          color: 'var(--gray-12)',
          border: '1px solid var(--gray-6)',
          borderRadius: '12px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        },
        success: {
          style: {
            background: 'var(--green-2)',
            color: 'var(--green-11)',
            border: '1px solid var(--green-6)',
            backdropFilter: 'blur(12px)',
          },
          iconTheme: {
            primary: 'var(--green-9)',
            secondary: 'var(--color-background)',
          },
        },
        error: {
          style: {
            background: 'var(--red-2)',
            color: 'var(--red-11)',
            border: '1px solid var(--red-6)',
            backdropFilter: 'blur(12px)',
          },
          iconTheme: {
            primary: 'var(--red-9)',
            secondary: 'var(--color-background)',
          },
        },
      }}
    />
  )
}
