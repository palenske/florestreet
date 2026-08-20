'use client'

import { useState, useEffect, useCallback } from 'react'
import { Loader2, Leaf } from 'lucide-react'
import { toast } from 'sonner'
import AuthScreen from '@/components/auth/auth-screen'
import AppHeader from '@/components/layout/app-header'
import BottomNav, { type TabId } from '@/components/layout/bottom-nav'
import MapView from '@/components/inventory/map-view'
import InventoryList from '@/components/inventory/inventory-list'
import FriendsList from '@/components/friends/friends-list'
import PointForm from '@/components/points/point-form'
import PointDetail from '@/components/points/point-detail'
import { useGeolocation } from '@/hooks/use-geolocation'
import type { UserDTO, CollectionPointDTO, FriendDTO, PointType } from '@/lib/types'

export default function Home() {
  const [user, setUser] = useState<UserDTO | null>(null)
  const [bootstrapped, setBootstrapped] = useState(false)

  const [tab, setTab] = useState<TabId>('map')
  const [points, setPoints] = useState<CollectionPointDTO[]>([])
  const [friends, setFriends] = useState<FriendDTO[]>([])
  const [stats, setStats] = useState<{ myPoints: number; pendingRequests: number }>({
    myPoints: 0,
    pendingRequests: 0,
  })

  const [pointsLoading, setPointsLoading] = useState(true)
  const [friendsLoading, setFriendsLoading] = useState(true)

  const [detailPoint, setDetailPoint] = useState<CollectionPointDTO | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [editingPoint, setEditingPoint] = useState<CollectionPointDTO | null>(null)
  const [formOpen, setFormOpen] = useState(false)

  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState<PointType | 'all'>('all')

  // Single shared geolocation instance via Context
  const { location, request, watch } = useGeolocation()

  useEffect(() => {
    let cancelled = false
    async function boot() {
      try {
        const res = await fetch('/api/auth/me')
        const data = await res.json()
        if (!cancelled && data.user) setUser(data.user)
      } catch {
        // ignore
      } finally {
        if (!cancelled) setBootstrapped(true)
      }
    }
    boot()
    return () => {
      cancelled = true
    }
  }, [])

  // Start geo request + watch when user logs in (single source of truth via Context)
  useEffect(() => {
    if (!user) return
    request()
    const stop = watch()
    return stop
  }, [user, request, watch])

  const loadPoints = useCallback(async () => {
    setPointsLoading(true)
    try {
      const res = await fetch('/api/points?scope=all')
      const data = await res.json()
      if (res.ok) setPoints(data.points ?? [])
    } catch {
      toast.error('Erro ao carregar pontos')
    } finally {
      setPointsLoading(false)
    }
  }, [])

  const loadFriends = useCallback(async () => {
    setFriendsLoading(true)
    try {
      const res = await fetch('/api/friends')
      const data = await res.json()
      if (res.ok) setFriends(data.friends ?? [])
    } catch {
      toast.error('Erro ao carregar amigos')
    } finally {
      setFriendsLoading(false)
    }
  }, [])

  const loadStats = useCallback(async () => {
    try {
      const res = await fetch('/api/stats')
      const data = await res.json()
      if (res.ok) {
        setStats({
          myPoints: data.myPoints ?? 0,
          pendingRequests: data.pendingRequests ?? 0,
        })
      }
    } catch {
      // silent — stats are non-critical
    }
  }, [])

  useEffect(() => {
    if (user) {
      loadPoints()
      loadFriends()
      loadStats()
    }
  }, [user, loadPoints, loadFriends, loadStats])

  function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST' }).finally(() => {
      setUser(null)
      setPoints([])
      setFriends([])
      setStats({ myPoints: 0, pendingRequests: 0 })
      toast.success('Você saiu da sua conta')
    })
  }

  function handleAuth(u: UserDTO) {
    setUser(u)
  }

  function handlePointClick(p: CollectionPointDTO) {
    setDetailPoint(p)
    setDetailOpen(true)
  }

  function handleAddClick() {
    setEditingPoint(null)
    setFormOpen(true)
  }

  function handleEdit(p: CollectionPointDTO) {
    setEditingPoint(p)
    setFormOpen(true)
  }

  function handleSaved(point: CollectionPointDTO) {
    setPoints((prev) => {
      const idx = prev.findIndex((p) => p.id === point.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = point
        return next
      }
      return [point, ...prev]
    })
    loadStats()
  }

  function handleDeleted(id: string) {
    setPoints((prev) => prev.filter((p) => p.id !== id))
    loadStats()
  }

  if (!bootstrapped) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center">
            <Leaf className="w-7 h-7 text-primary-foreground" />
          </div>
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  if (!user) {
    return <AuthScreen onAuth={handleAuth} />
  }

  const visiblePoints =
    typeFilter === 'all'
      ? points
      : points.filter((p) => p.type === typeFilter)

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <AppHeader user={user} pendingRequests={stats.pendingRequests} onLogout={handleLogout} />

      <main className="flex-1 relative overflow-hidden">
        {tab === 'map' && (
          <MapView
            points={visiblePoints}
            loading={pointsLoading}
            onPointClick={handlePointClick}
            onAddClick={handleAddClick}
          />
        )}

        {tab === 'inventory' && (
          <InventoryList
            points={points.filter((p) => p.ownerId === user.id || p.sharedWithMe)}
            loading={pointsLoading}
            onPointClick={handlePointClick}
            onAddClick={handleAddClick}
            search={search}
            onSearchChange={setSearch}
            typeFilter={typeFilter}
            onTypeFilterChange={setTypeFilter}
          />
        )}

        {tab === 'friends' && (
          <FriendsList
            friends={friends}
            loading={friendsLoading}
            onChanged={() => {
              loadFriends()
              loadStats()
            }}
            onViewPoints={(friendId, friendName) => {
              // Filter points to show only those shared by this friend
              const shared = points.filter((p) => p.ownerId === friendId)
              if (shared.length === 0) {
                toast.info(`${friendName} ainda não compartilhou pontos com você`)
                return
              }
              setTab('map')
              toast.success(`Mostrando ${shared.length} ponto(s) de ${friendName} no mapa`)
            }}
          />
        )}
      </main>

      <BottomNav
        active={tab}
        onChange={setTab}
        pendingRequests={stats.pendingRequests}
        pointsCount={stats.myPoints}
      />

      {/* Forms */}
      <PointForm
        open={formOpen}
        onOpenChange={setFormOpen}
        onSaved={handleSaved}
        initial={editingPoint}
      />

      <PointDetail
        point={detailPoint}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEdit}
        onDeleted={handleDeleted}
        isOwner={detailPoint ? detailPoint.ownerId === user.id : false}
        friends={friends}
      />
    </div>
  )
}
