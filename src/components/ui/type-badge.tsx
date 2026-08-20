'use client'

import { Badge } from '@/components/ui/badge'
import { POINT_TYPE_META, type PointType } from '@/lib/types'
import { cn } from '@/lib/utils'

interface TypeBadgeProps {
  type: PointType
  variant?: 'solid' | 'subtle' | 'outline'
  withLabel?: boolean
  className?: string
}

export default function TypeBadge({
  type,
  variant = 'subtle',
  withLabel = true,
  className,
}: TypeBadgeProps) {
  const meta = POINT_TYPE_META[type]

  if (variant === 'solid') {
    return (
      <Badge
        className={cn('text-white border-0', className)}
        style={{ backgroundColor: meta.color }}
      >
        <span className="mr-1">{meta.emoji}</span>
        {withLabel && meta.label}
      </Badge>
    )
  }

  if (variant === 'outline') {
    return (
      <Badge
        variant="outline"
        className={cn('border-current', className)}
        style={{ color: meta.color }}
      >
        <span className="mr-1">{meta.emoji}</span>
        {withLabel && meta.label}
      </Badge>
    )
  }

  // subtle (default)
  return (
    <Badge
      variant="outline"
      className={cn('border-current/20 bg-current/10', className)}
      style={{ color: meta.color }}
    >
      <span className="mr-1">{meta.emoji}</span>
      {withLabel && meta.label}
    </Badge>
  )
}
