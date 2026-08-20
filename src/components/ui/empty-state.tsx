'use client'

import { LucideIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  size?: 'sm' | 'md' | 'lg'
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  size = 'md',
}: EmptyStateProps) {
  const dimensions = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-20 h-20',
  }
  const iconSize = {
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-10 h-10',
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div
        className={`${dimensions[size]} rounded-2xl bg-primary/10 flex items-center justify-center mb-4`}
      >
        <Icon className={`${iconSize[size]} text-primary`} />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs leading-relaxed">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <Button
          onClick={onAction}
          className="mt-5 bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {actionLabel}
        </Button>
      )}
    </div>
  )
}
