'use client'

import { useTheme } from '@/contexts/theme-context'
import { Button } from './button'
import { SunIcon, MoonIcon } from '@radix-ui/react-icons'
import { useEffect, useState } from 'react'

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="h-9 w-9 p-0 rounded-lg border border-gray-200 bg-gray-50"
        disabled
      >
        <div className="h-4 w-4 bg-gray-300 rounded animate-pulse" />
      </Button>
    )
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={toggleTheme}
      className="h-9 w-9 p-0 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 group relative overflow-hidden"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Sun Icon */}
        <SunIcon 
          className={`h-4 w-4 transition-all duration-300 ${
            theme === 'light' 
              ? 'text-yellow-500 scale-100 rotate-0' 
              : 'text-gray-400 scale-75 -rotate-90'
          }`}
        />
        
        {/* Moon Icon */}
        <MoonIcon 
          className={`h-4 w-4 absolute transition-all duration-300 ${
            theme === 'dark' 
              ? 'text-blue-400 scale-100 rotate-0' 
              : 'text-gray-400 scale-75 rotate-90'
          }`}
        />
      </div>
      
      {/* Hover effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-yellow-100 to-blue-100 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-lg" />
    </Button>
  )
}

// Alternative toggle with text label
export function ThemeToggleWithLabel() {
  const { theme, toggleTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-9 px-3 rounded-lg border border-gray-200 bg-gray-50"
        disabled
      >
        <div className="h-4 w-4 bg-gray-300 rounded animate-pulse mr-2" />
        <span className="text-gray-400">Loading...</span>
      </Button>
    )
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={toggleTheme}
      className="h-9 px-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-all duration-200 group"
      title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
    >
      {theme === 'light' ? (
        <>
          <MoonIcon className="h-4 w-4 mr-2 text-gray-600 group-hover:text-blue-600 transition-colors" />
          <span className="text-gray-700 group-hover:text-blue-700 transition-colors">Dark Mode</span>
        </>
      ) : (
        <>
          <SunIcon className="h-4 w-4 mr-2 text-gray-600 group-hover:text-yellow-600 transition-colors" />
          <span className="text-gray-700 group-hover:text-yellow-700 transition-colors">Light Mode</span>
        </>
      )}
    </Button>
  )
}
