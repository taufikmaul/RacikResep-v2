'use client'

import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select'

interface SalesChannelIcon {
  id: string
  name: string
  icon: string
  color: string
}

const SALES_CHANNEL_ICONS: SalesChannelIcon[] = [
  { id: 'shopeefood', name: 'ShopeeFood', icon: '🛒', color: '#EE4D2D' },
  { id: 'gofood', name: 'GoFood', icon: '🛵', color: '#00AA13' },
  { id: 'grabfood', name: 'GrabFood', icon: '🚗', color: '#00B14F' },
  { id: 'tokopedia', name: 'Tokopedia', icon: '🛍️', color: '#42B883' },
  { id: 'shopee', name: 'Shopee', icon: '🛒', color: '#EE4D2D' },
  { id: 'tiktokshop', name: 'TikTok Shop', icon: '🎵', color: '#000000' },
  { id: 'lazada', name: 'Lazada', icon: '📦', color: '#0F146D' },
  { id: 'bukalapak', name: 'Bukalapak', icon: '🏪', color: '#E31E24' },
  { id: 'blibli', name: 'Blibli', icon: '🛒', color: '#FF6B35' },
  { id: 'zalora', name: 'Zalora', icon: '👗', color: '#FF6B6B' },
  { id: 'other', name: 'Lainnya', icon: '🏢', color: '#6B7280' }
]

interface SalesChannelIconSelectorProps {
  value: string
  onValueChange: (value: string) => void
  placeholder?: string
}

export function SalesChannelIconSelector({ 
  value, 
  onValueChange, 
  placeholder = "Pilih ikon channel" 
}: SalesChannelIconSelectorProps) {
  const selectedIcon = SALES_CHANNEL_ICONS.find(icon => icon.id === value)

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder}>
          {selectedIcon && (
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: selectedIcon.color }}
              >
                {selectedIcon.icon}
              </div>
              <span>{selectedIcon.name}</span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SALES_CHANNEL_ICONS.map((icon) => (
          <SelectItem key={icon.id} value={icon.id}>
            <div className="flex items-center gap-2">
              <div 
                className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                style={{ backgroundColor: icon.color }}
              >
                {icon.icon}
              </div>
              <span>{icon.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

export { SALES_CHANNEL_ICONS }