'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import {
  Plus,
  Locate,
  Loader2,
  MapPin,
  List,
  Layers,
  Leaf,
  Sparkles,
  X,
  Navigation,
  AlertTriangle,
} from 'lucide-react'
import CollectionMap from '@/components/map/collection-map'
import PointCard from '@/components/points/point-card'
import EmptyState from '@/components/ui/empty-state'
import { useGeolocation } from '@/hooks/use-geolocation'
import type { CollectionPointDTO } from '@/lib/types'
import { POINT_TYPE_META } from '@/lib/types'
import { formatAccuracy } from '@/lib/format'

interface MapViewProps {
  points: CollectionPointDTO[]
  loading: boolean
  onPointClick: (p: CollectionPointDTO) => void
  onAddClick: () => void
}

export default function MapView({
  points,
  loading,
  onPointClick,
  onAddClick,
}: MapViewProps) {
  const {
    location,
    loading: geoLoading,
    error: geoError,
    warning: geoWarning,
    request,
    watch,
    refresh,
  } = useGeolocation()
  const [userCenter, setUserCenter] = useState<{ lat: number; lng: number } | null>(null)
  const [showList, setShowList] = useState(false)
  const [dismissedGeoPrompt, setDismissedGeoPrompt] = useState(false)
  const watchStartedRef = useRef(false)

  useEffect(() => {
    if (!watchStartedRef.current) {
      watchStartedRef.current = true
      const stop = watch()
      return stop
    }
  }, [watch])

  const center = userCenter ?? (location ? { lat: location.latitude, lng: location.longitude } : null)

  const recenter = useCallback(() => {
    if (location) {
      setUserCenter({ lat: location.latitude, lng: location.longitude })
    } else {
      request()
    }
  }, [location, request])

  const stats = {
    total: points.length,
    fruiting: points.filter((p) => p.hasFruit).length,
    byType: (Object.keys(POINT_TYPE_META) as Array<keyof typeof POINT_TYPE_META>).map((t) => ({
      type: t,
      count: points.filter((p) => p.type === t).length,
    })),
  }

  const showGeoPrompt = !dismissedGeoPrompt && !geoError && !location && !geoLoading

  return (
    <div className="h-full w-full flex flex-col bg-background overflow-hidden">
      {/* === TOOLBAR (above map) === */}
      <div className="shrink-0 border-b bg-background px-3 py-2.5 space-y-2">
        {/* Stats row */}
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-primary/10 border border-primary/20">
              <Leaf className="w-3.5 h-3.5 text-primary" />
              <span className="text-sm font-semibold leading-none">{stats.total}</span>
              <span className="text-xs text-muted-foreground leading-none">pontos</span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-warning/10 border border-warning/20">
              <Sparkles className="w-3.5 h-3.5 text-warning" />
              <span className="text-sm font-semibold leading-none">{stats.fruiting}</span>
              <span className="text-xs text-muted-foreground leading-none hidden sm:inline">frutificando</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-1.5">
            {stats.byType.map((s) => {
              const meta = POINT_TYPE_META[s.type]
              return (
                <div
                  key={s.type}
                  className="flex items-center gap-1 px-2 py-1 rounded-md border text-xs"
                  style={{ borderColor: `${meta.color}33` }}
                >
                  <span className="leading-none">{meta.emoji}</span>
                  <span className="font-medium leading-none" style={{ color: meta.color }}>
                    {s.count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Geo status line */}
        {location && (
          <div className="text-xs text-muted-foreground flex items-center gap-1.5 font-mono">
            <Navigation className="w-3 h-3 text-primary" />
            <span>
              {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
            </span>
            <span className="text-primary">•</span>
            <span>{formatAccuracy(location.accuracy)}</span>
          </div>
        )}

        {/* Geo error banner */}
        {geoError && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive rounded-lg px-3 py-2 text-xs flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1">{geoError}</span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => request()}
              disabled={geoLoading}
              className="h-6 text-xs border-destructive/30 text-destructive hover:bg-destructive/10"
            >
              Tentar
            </Button>
            <button
              onClick={() => setDismissedGeoPrompt(true)}
              className="text-destructive/60 hover:text-destructive"
              aria-label="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Geo warning (low accuracy) */}
        {geoWarning && !geoError && location && (
          <div className="bg-warning/10 border border-warning/20 text-warning-foreground rounded-lg px-3 py-1.5 text-xs flex items-center gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-warning flex-shrink-0" />
            <span className="flex-1 text-warning">{geoWarning}</span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => refresh()}
              disabled={geoLoading}
              className="h-6 text-xs text-warning hover:bg-warning/10"
            >
              Melhorar
            </Button>
          </div>
        )}

        {/* Geo prompt - ask for location */}
        {showGeoPrompt && (
          <div className="bg-primary/10 border border-primary/20 text-primary rounded-lg px-3 py-2 text-xs flex items-center gap-2">
            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="flex-1 text-primary/90">Ative sua localização para ver pontos próximos.</span>
            <Button
              size="sm"
              onClick={() => request()}
              className="h-6 text-xs"
            >
              Localizar
            </Button>
            <button
              onClick={() => setDismissedGeoPrompt(true)}
              className="text-primary/60 hover:text-primary"
              aria-label="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {/* === MAP CONTAINER === */}
      <div className="flex-1 relative min-h-0 bg-muted">
        {loading ? (
          <Skeleton className="absolute inset-0" />
        ) : (
          <CollectionMap
            points={points}
            userLocation={location}
            onPointClick={onPointClick}
            center={center ?? undefined}
            zoom={15}
          />
        )}
      </div>

      {/* === ACTION BAR (below map) === */}
      <div className="shrink-0 border-t bg-background px-3 py-2.5">
        <div className="flex items-center justify-between gap-2 max-w-3xl mx-auto">
          <Button
            onClick={onAddClick}
            className="rounded-full pl-4 pr-5 h-11"
          >
            <Plus className="w-5 h-5 mr-1.5" />
            <span className="font-semibold text-sm">Novo ponto</span>
          </Button>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => setShowList(true)}
              className="h-11 rounded-full px-3 relative"
              aria-label={`Ver lista de pontos, ${points.length} disponíveis`}
            >
              <List className="w-4 h-4 mr-1.5" />
              <span className="text-sm font-medium">Lista</span>
              {points.length > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center border-2 border-background">
                  {points.length > 99 ? '99+' : points.length}
                </span>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={recenter}
              disabled={geoLoading}
              className="h-11 w-11 rounded-full p-0"
              aria-label="Centralizar na minha localização"
            >
              {geoLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Locate className="w-4 h-4 text-primary" />
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* List sheet */}
      <Sheet open={showList} onOpenChange={setShowList}>
        <SheetContent
          side="bottom"
          className="h-[70vh] sm:max-w-md sm:mx-auto sm:rounded-t-2xl p-0 flex flex-col"
        >
          <SheetHeader className="px-4 pt-4 pb-3 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2 text-base">
              <Layers className="w-4 h-4 text-primary" />
              Pontos visíveis
              <Badge variant="secondary" className="text-xs">
                {points.length}
              </Badge>
            </SheetTitle>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin">
            {points.length === 0 ? (
              <EmptyState
                icon={Leaf}
                title="Nenhum ponto visível"
                description="Adicione pontos ao mapa ou ajuste os filtros para ver mais locais."
                size="sm"
              />
            ) : (
              points.map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setShowList(false)
                    setUserCenter({ lat: p.latitude, lng: p.longitude })
                    setTimeout(() => onPointClick(p), 200)
                  }}
                  className="w-full text-left"
                  aria-label={`Ver detalhes de ${p.name}`}
                >
                  <PointCard point={p} compact />
                </button>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
