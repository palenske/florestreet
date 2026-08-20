'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { POINT_TYPE_META, type CollectionPointDTO } from '@/lib/types'
import { formatDateShort, getInitials } from '@/lib/format'
import { MapPin, Calendar, Share2, Leaf } from 'lucide-react'

interface PointCardProps {
  point: CollectionPointDTO
  onClick?: (p: CollectionPointDTO) => void
  compact?: boolean
}

export default function PointCard({ point, onClick, compact }: PointCardProps) {
  const meta = POINT_TYPE_META[point.type]

  return (
    <Card
      className={`overflow-hidden transition-colors ${
        onClick ? 'cursor-pointer hover:border-primary/40 hover:bg-accent/30' : ''
      } ${compact ? 'py-0 gap-0' : ''}`}
      onClick={() => onClick?.(point)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(point)
              }
            }
          : undefined
      }
      aria-label={onClick ? `Ver detalhes de ${point.name}` : undefined}
    >
      {point.imageUrl ? (
         
        <img
          src={point.imageUrl}
          alt={`Foto de ${point.name}`}
          className="w-full h-40 object-cover"
          loading="lazy"
        />
      ) : (
        <div
          className="w-full h-40 flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${meta.color}1a, ${meta.color}0a)`,
          }}
        >
          <Leaf className="w-10 h-10" style={{ color: meta.color }} aria-hidden />
        </div>
      )}
      <CardContent className="p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-sm leading-tight truncate">{point.name}</h3>
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded border"
                style={{ color: meta.color, borderColor: `${meta.color}55` }}
              >
                {meta.emoji} {meta.label}
              </span>
              {point.hasFruit && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                  🌱 Com frutos
                </span>
              )}
            </div>
          </div>
          {point.sharedWithMe && (
            <Share2
              className="w-3.5 h-3.5 text-primary flex-shrink-0"
              aria-label="Compartilhado com você"
            />
          )}
        </div>

        {point.description && !compact && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {point.description}
          </p>
        )}

        <div className="flex items-center justify-between text-[11px] text-muted-foreground gap-2">
          <div className="flex items-center gap-1 min-w-0">
            <MapPin className="w-3 h-3 flex-shrink-0" aria-hidden />
            <span className="truncate">
              {point.address ?? `${point.latitude.toFixed(3)}, ${point.longitude.toFixed(3)}`}
            </span>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            <Calendar className="w-3 h-3" aria-hidden />
            <span>{formatDateShort(point.recordedAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 pt-1.5 border-t">
          <Avatar className="w-5 h-5">
            <AvatarFallback className="text-[9px] bg-primary/10 text-primary">
              {getInitials(point.ownerName) || '?'}
            </AvatarFallback>
          </Avatar>
          <span className="text-[11px] text-muted-foreground truncate">
            {point.ownerName}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
