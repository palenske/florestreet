'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Search,
  UserPlus,
  Check,
  X,
  Loader2,
  Users,
  Trash2,
  Clock,
  Leaf,
} from 'lucide-react'
import { toast } from 'sonner'
import type { FriendDTO } from '@/lib/types'
import { getInitials, pluralize } from '@/lib/format'
import EmptyState from '@/components/ui/empty-state'

interface FriendsListProps {
  friends: FriendDTO[]
  loading: boolean
  onChanged: () => void
  onViewPoints?: (friendId: string, friendName: string) => void
}

export default function FriendsList({ friends, loading, onChanged, onViewPoints }: FriendsListProps) {
  const [search, setSearch] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<
    Array<{
      id: string
      name: string
      email: string
      avatar: string | null
      friendshipStatus: string | null
    }>
  >([])
  const [addingId, setAddingId] = useState<string | null>(null)

  async function handleSearch() {
    if (search.trim().length < 2) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      const res = await fetch(`/api/friends/search?q=${encodeURIComponent(search)}`)
      const data = await res.json()
      setResults(data.users ?? [])
    } catch {
      toast.error('Erro na busca')
    } finally {
      setSearching(false)
    }
  }

  async function handleAddFriend(email: string, id: string) {
    setAddingId(id)
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao adicionar')
        return
      }
      if (data.autoAccepted) {
        toast.success('Vocês agora são amigos!')
      } else {
        toast.success('Solicitação de amizade enviada!')
      }
      setSearch('')
      setResults([])
      onChanged()
    } catch {
      toast.error('Erro de rede')
    } finally {
      setAddingId(null)
    }
  }

  async function handleAction(friendshipId: string, action: 'accept' | 'decline') {
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erro')
        return
      }
      toast.success(action === 'accept' ? 'Amizade aceita!' : 'Solicitação recusada')
      onChanged()
    } catch {
      toast.error('Erro de rede')
    }
  }

  async function handleRemove(friendshipId: string, name: string) {
    try {
      const res = await fetch(`/api/friends/${friendshipId}`, { method: 'DELETE' })
      if (!res.ok) {
        toast.error('Erro ao remover')
        return
      }
      toast.success(`${name} foi removido(a) dos seus amigos`)
      onChanged()
    } catch {
      toast.error('Erro de rede')
    }
  }

  const pending = friends.filter((f) => f.status === 'pending' && f.direction === 'incoming')
  const sent = friends.filter((f) => f.status === 'pending' && f.direction === 'outgoing')
  const accepted = friends.filter((f) => f.status === 'accepted')

  return (
    <div className="flex flex-col h-full">
      {/* Search bar */}
      <div className="px-4 pt-4 pb-3 border-b bg-background shrink-0 space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Buscar por e-mail ou nome..."
              className="pl-9 h-10"
              aria-label="Buscar amigos"
            />
          </div>
          <Button
            onClick={handleSearch}
            disabled={searching || search.length < 2}
            size="sm"
            className="h-10 px-3"
            aria-label="Buscar"
          >
            {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </Button>
        </div>
        {results.length > 0 && (
          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted-foreground">Resultados da busca:</p>
            {results.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 p-2.5 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="bg-primary/10 text-primary text-xs">
                      {getInitials(u.name) || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{u.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                  </div>
                </div>
                {u.friendshipStatus === 'accepted' ? (
                  <Badge variant="outline" className="text-xs">
                    Amigo
                  </Badge>
                ) : u.friendshipStatus === 'pending' ? (
                  <Badge variant="outline" className="text-xs text-warning border-warning/30">
                    Pendente
                  </Badge>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleAddFriend(u.email, u.id)}
                    disabled={addingId === u.id}
                    className="h-8 text-xs border-primary/30 text-primary hover:bg-primary/5"
                  >
                    {addingId === u.id ? (
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                    ) : (
                      <UserPlus className="w-3.5 h-3.5 mr-1" />
                    )}
                    Add
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <>
            {/* Pending incoming requests */}
            {pending.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Solicitações recebidas
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                    {pending.length}
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {pending.map((f) => (
                    <Card key={f.friendshipId}>
                      <CardContent className="p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(f.name) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{f.name}</p>
                            <p className="text-xs text-muted-foreground truncate">{f.email}</p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8 border-primary/30 text-primary hover:bg-primary/5"
                            onClick={() => handleAction(f.friendshipId, 'accept')}
                            aria-label={`Aceitar solicitação de ${f.name}`}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => handleAction(f.friendshipId, 'decline')}
                            aria-label={`Recusar solicitação de ${f.name}`}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}

            {/* Accepted friends */}
            <section>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                Seus amigos
                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                  {accepted.length}
                </Badge>
              </h3>
              {accepted.length === 0 ? (
                <EmptyState
                  icon={Users}
                  title="Nenhum amigo ainda"
                  description="Busque pelo e-mail de quem você conhece para compartilhar pontos de coleta."
                  size="sm"
                />
              ) : (
                <div className="space-y-2">
                  {accepted.map((f) => (
                    <Card key={f.friendshipId}>
                      <CardContent className="p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {getInitials(f.name) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{f.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {pluralize(f.pointsCount ?? 0, 'ponto', 'pontos')} • {f.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          {onViewPoints && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 text-xs"
                              onClick={() => onViewPoints(f.id, f.name)}
                            >
                              <Leaf className="w-3.5 h-3.5 mr-1" />
                              Ver pontos
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleRemove(f.friendshipId, f.name)}
                            aria-label={`Remover ${f.name} dos amigos`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </section>

            {/* Sent requests */}
            {sent.length > 0 && (
              <section>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  Solicitações enviadas
                  <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                    {sent.length}
                  </Badge>
                </h3>
                <div className="space-y-2">
                  {sent.map((f) => (
                    <Card key={f.friendshipId}>
                      <CardContent className="p-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="w-10 h-10">
                            <AvatarFallback className="bg-muted text-muted-foreground text-xs">
                              {getInitials(f.name) || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="text-sm font-medium truncate">{f.name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              Aguardando aceitação
                            </p>
                          </div>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemove(f.friendshipId, f.name)}
                          aria-label={`Cancelar solicitação para ${f.name}`}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
