'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Leaf, LogOut, Bell } from 'lucide-react'
import type { UserDTO } from '@/lib/types'
import { getInitials } from '@/lib/format'

interface AppHeaderProps {
  user: UserDTO
  pendingRequests: number
  onLogout: () => void
}

export default function AppHeader({ user, pendingRequests, onLogout }: AppHeaderProps) {
  return (
    <header className="shrink-0 z-20 bg-background border-b pt-safe">
      <div className="px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shrink-0">
            <Leaf className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base font-semibold leading-none truncate">Fora &amp; Flora</h1>
            <p className="text-xs text-muted-foreground mt-1 truncate">
              Olá, {user.name.split(' ')[0] || 'amigo(a)'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {pendingRequests > 0 && (
            <Badge
              variant="outline"
              className="text-xs py-1 px-1.5 inline-flex items-center gap-1 border-primary/30 text-primary"
              aria-label={`${pendingRequests} solicitações de amizade pendentes`}
            >
              <Bell className="w-3 h-3" />
              {pendingRequests}
            </Badge>
          )}
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
              {getInitials(user.name) || '?'}
            </AvatarFallback>
          </Avatar>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground"
            onClick={onLogout}
            aria-label="Sair da conta"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  )
}
