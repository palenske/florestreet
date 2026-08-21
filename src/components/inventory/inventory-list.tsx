'use client'

import { useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Skeleton } from '@/components/ui/skeleton'
import { Plus, Search, Leaf, Share2 } from 'lucide-react'
import PointCard from '@/components/points/point-card'
import EmptyState from '@/components/ui/empty-state'
import { POINT_TYPE_META, type CollectionPointDTO, type PointType } from '@/lib/types'
import { pluralize } from '@/lib/format'

interface InventoryListProps {
  points: CollectionPointDTO[]
  loading: boolean
  onPointClick: (p: CollectionPointDTO) => void
  onAddClick: () => void
  search: string
  onSearchChange: (v: string) => void
  typeFilter: PointType | 'all'
  onTypeFilterChange: (v: PointType | 'all') => void
}

export default function InventoryList({
  points,
  loading,
  onPointClick,
  onAddClick,
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
}: InventoryListProps) {
  const filtered = useMemo(() => {
    return points.filter((p) => {
      if (typeFilter !== 'all' && p.type !== typeFilter) return false
      if (search) {
        const q = search.toLowerCase()
        return (
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.address?.toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [points, search, typeFilter])

  const sharedCount = points.filter((p) => p.sharedWithMe).length

  return (
    <div className="flex flex-col h-full">
      {/* Header / search */}
      <div className="px-4 pt-4 pb-3 space-y-3 bg-background border-b shrink-0">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar por nome, descrição, endereço..."
            className="pl-9 h-10"
            aria-label="Buscar pontos"
          />
        </div>
        <Tabs
          value={typeFilter}
          onValueChange={(v) => onTypeFilterChange(v as PointType | 'all')}
        >
          <TabsList className="grid grid-cols-5 w-full h-9">
            <TabsTrigger value="all" className="text-xs">
              Todos
            </TabsTrigger>
            {(Object.keys(POINT_TYPE_META) as PointType[]).map((t) => (
              <TabsTrigger key={t} value={t} className="text-xs">
                {POINT_TYPE_META[t].emoji} {POINT_TYPE_META[t].label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-4 scrollbar-thin">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-40 w-full rounded-xl" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Leaf}
            title={points.length > 0 ? 'Nenhum resultado' : 'Seu inventário está vazio'}
            description={
              points.length > 0
                ? 'Tente ajustar a busca ou filtros para encontrar seus pontos.'
                : 'Catalogue o primeiro ponto: uma árvore frutífera, flor, erva ou planta ornamental próxima de você.'
            }
            actionLabel={points.length === 0 ? 'Adicionar primeiro ponto' : undefined}
            onAction={points.length === 0 ? onAddClick : undefined}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-4">
              {filtered.map((p) => (
                <PointCard key={p.id} point={p} onClick={onPointClick} />
              ))}
            </div>
            {sharedCount > 0 && (
              <p className="text-xs text-muted-foreground text-center mt-4 flex items-center justify-center gap-1">
                <Share2 className="w-3 h-3" />
                {pluralize(sharedCount, 'ponto compartilhado', 'pontos compartilhados')} com você
              </p>
            )}
          </>
        )}
      </div>

      {/* Floating add button (alternative path) */}
      <button
        onClick={onAddClick}
        className="absolute right-4 bottom-4 z-30 w-14 h-14 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg flex items-center justify-center transition-transform active:scale-95"
        aria-label="Adicionar novo ponto"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  )
}
