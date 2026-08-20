'use client'

import { useState, useEffect } from 'react'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import {
  MapPin,
  Calendar,
  Trash2,
  Pencil,
  Share2,
  Loader2,
  Navigation,
  FileText,
  StickyNote,
} from 'lucide-react'
import { toast } from 'sonner'
import { POINT_TYPE_META, type CollectionPointDTO, type FriendDTO } from '@/lib/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { formatDate, getInitials } from '@/lib/format'

interface PointDetailProps {
  point: CollectionPointDTO | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit?: (p: CollectionPointDTO) => void
  onDeleted?: (id: string) => void
  isOwner: boolean
  friends: FriendDTO[]
}

export default function PointDetail({
  point,
  open,
  onOpenChange,
  onEdit,
  onDeleted,
  isOwner,
  friends,
}: PointDetailProps) {
  const [deleting, setDeleting] = useState(false)
  const [sharing, setSharing] = useState(false)
  const [shareFriendId, setShareFriendId] = useState('')

  useEffect(() => {
    if (open) setShareFriendId('')
  }, [open])

  if (!point) return null

  const meta = POINT_TYPE_META[point.type]

  async function handleDelete() {
    if (!point) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/points/${point.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const d = await res.json()
        toast.error(d.error ?? 'Erro ao excluir')
        return
      }
      toast.success('Ponto excluído do inventário')
      onDeleted?.(point.id)
      onOpenChange(false)
    } catch {
      toast.error('Erro de rede')
    } finally {
      setDeleting(false)
    }
  }

  async function handleShare() {
    if (!point || !shareFriendId) {
      toast.error('Selecione um amigo para compartilhar')
      return
    }
    setSharing(true)
    try {
      const res = await fetch(`/api/points/${point.id}/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ friendId: shareFriendId }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Erro ao compartilhar')
        return
      }
      toast.success('Ponto compartilhado com sucesso!')
      setShareFriendId('')
    } catch {
      toast.error('Erro de rede')
    } finally {
      setSharing(false)
    }
  }

  function openInMaps() {
    if (!point) return
    const url = `https://www.openstreetmap.org/?mlat=${point.latitude}&mlon=${point.longitude}#map=18/${point.latitude}/${point.longitude}`
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  const acceptedFriends = friends.filter((f) => f.status === 'accepted')

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[88vh] sm:max-w-2xl sm:mx-auto sm:rounded-t-2xl p-0 flex flex-col z-[100]"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <SheetTitle className="flex items-center gap-2 text-left">
            <span className="text-xl" aria-hidden>
              {meta.emoji}
            </span>
            <span className="flex-1">{point.name}</span>
          </SheetTitle>
          <SheetDescription className="text-left">
            {meta.label}
            {point.sharedWithMe && ' • compartilhado com você'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {/* Hero image */}
          {point.imageUrl && (
             
            <img
              src={point.imageUrl}
              alt={`Foto de ${point.name}`}
              className="w-full h-56 object-cover"
            />
          )}

          <div className="p-5 space-y-5">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                style={{ color: meta.color, borderColor: `${meta.color}55` }}
              >
                {meta.emoji} {meta.label}
              </Badge>
              {point.hasFruit && (
                <Badge className="bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10">
                  🌱 Com frutos hoje
                </Badge>
              )}
            </div>

            {/* Owner */}
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Avatar className="w-10 h-10">
                <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                  {getInitials(point.ownerName) || '?'}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="text-xs text-muted-foreground">Registrado por</p>
                <p className="text-sm font-medium">{point.ownerName}</p>
              </div>
            </div>

            {/* Description */}
            {point.description && (
              <Section icon={FileText} title="Descrição">
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{point.description}</p>
              </Section>
            )}

            {/* Location */}
            <Section icon={MapPin} title="Localização">
              <div className="space-y-2">
                {point.address && (
                  <p className="text-sm font-medium">{point.address}</p>
                )}
                <p className="text-xs text-muted-foreground font-mono">
                  {point.latitude.toFixed(5)}, {point.longitude.toFixed(5)}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8"
                  onClick={openInMaps}
                >
                  <Navigation className="w-3.5 h-3.5 mr-1.5" />
                  Abrir no mapa
                </Button>
              </div>
            </Section>

            {/* Notes */}
            {point.notes && (
              <Section icon={StickyNote} title="Observações">
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {point.notes}
                </p>
              </Section>
            )}

            {/* Date */}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-muted-foreground" aria-hidden />
              <span className="text-muted-foreground">Registrado em</span>
              <span className="font-medium">{formatDate(point.recordedAt)}</span>
            </div>

            {/* Share section - owner only */}
            {isOwner && (
              <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-primary" />
                  <h4 className="text-sm font-semibold text-primary">
                    Compartilhar com amigo
                  </h4>
                </div>
                {acceptedFriends.length > 0 ? (
                  <div className="flex gap-2">
                    <Select value={shareFriendId} onValueChange={setShareFriendId}>
                      <SelectTrigger className="flex-1 h-9">
                        <SelectValue placeholder="Escolha um amigo" />
                      </SelectTrigger>
                      <SelectContent>
                        {acceptedFriends.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleShare}
                      disabled={sharing || !shareFriendId}
                      size="sm"
                      className="h-9"
                    >
                      {sharing ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Enviar'}
                    </Button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Adicione amigos para compartilhar este ponto com eles.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {isOwner && (
          <SheetFooter className="px-5 py-4 border-t gap-2 sm:gap-2 shrink-0">
            <Button
              variant="outline"
              type="button"
              onClick={() => {
                onEdit?.(point)
                onOpenChange(false)
              }}
              className="flex-1"
            >
              <Pencil className="w-4 h-4 mr-1.5" />
              Editar
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" type="button" className="flex-1">
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir este ponto?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta ação não pode ser desfeita. O ponto &ldquo;{point.name}&rdquo; será
                    removido permanentemente do seu inventário.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={deleting}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Excluir'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof MapPin
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" aria-hidden />
        {title}
      </h4>
      {children}
    </div>
  )
}
