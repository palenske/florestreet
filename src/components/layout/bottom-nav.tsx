'use client'

import { Map as MapIcon, List, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TabId = 'map' | 'inventory' | 'friends'

interface BottomNavProps {
  active: TabId
  onChange: (t: TabId) => void
  pendingRequests?: number
  pointsCount?: number
}

const items: { id: TabId; label: string; icon: typeof MapIcon; ariaLabel: string }[] = [
  { id: 'map', label: 'Mapa', icon: MapIcon, ariaLabel: 'Ver mapa de pontos' },
  { id: 'inventory', label: 'Inventário', icon: List, ariaLabel: 'Ver inventário de pontos' },
  { id: 'friends', label: 'Amigos', icon: Users, ariaLabel: 'Ver amigos' },
]

export default function BottomNav({
  active,
  onChange,
  pendingRequests = 0,
  pointsCount = 0,
}: BottomNavProps) {
  return (
    <nav
      className="shrink-0 z-30 bg-background border-t pb-safe"
      role="tablist"
      aria-label="Navegação principal"
    >
      <div className="grid grid-cols-3 max-w-2xl mx-auto">
        {items.map((it) => {
          const Icon = it.icon
          const isActive = active === it.id
          const badge =
            it.id === 'friends' ? pendingRequests : it.id === 'inventory' ? pointsCount : 0
          return (
            <button
              key={it.id}
              role="tab"
              aria-selected={isActive}
              aria-label={it.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onChange(it.id)}
              className={cn(
                'flex flex-col items-center justify-center gap-1 py-2.5 text-xs font-medium transition-colors relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className="relative">
                <Icon
                  className={cn('w-5 h-5 transition-transform', isActive && 'scale-110')}
                />
                {badge > 0 && (
                  <span
                    className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background"
                    aria-label={`${badge} ${it.id === 'friends' ? 'solicitações' : 'pontos'}`}
                  >
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] leading-none">{it.label}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-primary rounded-b-full" />
              )}
            </button>
          )
        })}
      </div>
    </nav>
  )
}
