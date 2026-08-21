'use client'

import { useState, useRef, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet'
import { Loader2, MapPin, ImagePlus, X, Locate, Sparkles, Check } from 'lucide-react'
import { toast } from 'sonner'
import { POINT_TYPE_META, type PointType, type CollectionPointDTO } from '@/lib/types'
import { createPointSchema, type CreatePointInput } from '@/lib/schemas/point'
import CollectionMap from '@/components/map/collection-map'
import { useGeolocation } from '@/hooks/use-geolocation'
import { formatAccuracy } from '@/lib/format'

interface PointFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSaved: (point: CollectionPointDTO) => void
  initial?: CollectionPointDTO | null
}

export default function PointForm({
  open,
  onOpenChange,
  onSaved,
  initial,
}: PointFormProps) {
  const isEdit = !!initial
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const {
    location: geoLocation,
    loading: geoLoading,
    warning: geoWarning,
    request: requestGeo,
  } = useGeolocation()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreatePointInput>({
    resolver: zodResolver(createPointSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'fruit',
      hasFruit: false,
      imageUrl: null,
      latitude: null as unknown as number,
      longitude: null as unknown as number,
      address: '',
      notes: '',
      recordedAt: new Date().toISOString().slice(0, 10),
    },
  })

  const type = watch('type')
  const hasFruit = watch('hasFruit')
  const latitude = watch('latitude')
  const longitude = watch('longitude')
  const name = watch('name')
  const imageUrl = watch('imageUrl')

  // Reset form when sheet opens/closes
  useEffect(() => {
    if (!open) return
    if (initial) {
      reset({
        name: initial.name,
        description: initial.description ?? '',
        type: initial.type,
        hasFruit: initial.hasFruit,
        imageUrl: initial.imageUrl,
        latitude: initial.latitude,
        longitude: initial.longitude,
        address: initial.address ?? '',
        notes: initial.notes ?? '',
        recordedAt: new Date(initial.recordedAt).toISOString().slice(0, 10),
      })
    } else {
      reset({
        name: '',
        description: '',
        type: 'fruit',
        hasFruit: false,
        imageUrl: null,
        latitude: null as unknown as number,
        longitude: null as unknown as number,
        address: '',
        notes: '',
        recordedAt: new Date().toISOString().slice(0, 10),
      })
    }
  }, [open, initial])

  // Sync geoLocation to form fields when fresh
  useEffect(() => {
    if (open && !isEdit && geoLocation) {
      setValue('latitude', geoLocation.latitude)
      setValue('longitude', geoLocation.longitude)
    }
  }, [geoLocation?.latitude, geoLocation?.longitude, open, isEdit, setValue])

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) {
        toast.error(data.error ?? 'Falha no upload')
        return
      }
      setValue('imageUrl', data.url)
      toast.success('Imagem enviada')
    } catch {
      toast.error('Erro de rede no upload')
    } finally {
      setUploading(false)
    }
  }

  function handleUseLocation() {
    requestGeo()
  }

  async function onSubmit(data: CreatePointInput) {
    const payload = {
      ...data,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      address: data.address?.trim() || null,
      notes: data.notes?.trim() || null,
      recordedAt: new Date(data.recordedAt ?? new Date().toISOString().slice(0, 10)).toISOString(),
    }

    const url = isEdit ? `/api/points/${initial!.id}` : '/api/points'
    const method = isEdit ? 'PATCH' : 'POST'
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const result = await res.json()
    if (!res.ok) {
      toast.error(result.error ?? 'Erro ao salvar')
      return
    }
    toast.success(isEdit ? 'Ponto atualizado!' : 'Ponto adicionado ao inventário!')
    onSaved(result.point)
    onOpenChange(false)
  }

  const pickedLocation =
    latitude != null && longitude != null ? { lat: latitude, lng: longitude } : null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[92vh] sm:max-w-2xl sm:mx-auto sm:rounded-t-2xl p-0 flex flex-col z-[100]"
      >
        <SheetHeader className="px-5 pt-5 pb-3 border-b shrink-0">
          <SheetTitle>{isEdit ? 'Editar ponto' : 'Novo ponto de coleta'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Atualize as informações do local.'
              : 'Catalogue a planta, árvore ou flor que você encontrou.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <form id="point-form" onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-5">
            {/* Map for picking location */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-primary" />
                  Localização
                </Label>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={handleUseLocation}
                  disabled={geoLoading}
                  className="h-8 text-xs"
                >
                  {geoLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                      Localizando...
                    </>
                  ) : (
                    <>
                      <Locate className="w-3.5 h-3.5 mr-1" />
                      Usar minha localização
                    </>
                  )}
                </Button>
              </div>
              <div className="rounded-xl overflow-hidden border h-56 sm:h-64 relative">
                <CollectionMap
                  points={[]}
                  userLocation={geoLocation}
                  pickingMode
                  pickedLocation={pickedLocation}
                  onMapClick={(lat, lng) => {
                    setValue('latitude', lat)
                    setValue('longitude', lng)
                  }}
                  center={
                    pickedLocation
                      ? { lat: pickedLocation.lat, lng: pickedLocation.lng }
                      : geoLocation
                        ? { lat: geoLocation.latitude, lng: geoLocation.longitude }
                        : undefined
                  }
                  zoom={16}
                />
              </div>
              {latitude != null && longitude != null ? (
                <div className="flex items-center justify-between text-xs">
                  <p className="text-muted-foreground font-mono">
                    {latitude.toFixed(5)}, {longitude.toFixed(5)}
                  </p>
                  {geoLocation && (
                    <p className="text-muted-foreground">
                      Precisão: {formatAccuracy(geoLocation.accuracy)}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-xs text-warning">
                  Toque no mapa ou use sua localização para definir o ponto.
                </p>
              )}
              {geoWarning && (
                <p className="text-xs text-warning flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {geoWarning}
                </p>
              )}
            </div>

            {/* Image upload */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Foto</Label>
              {imageUrl ? (
                <div className="relative rounded-xl overflow-hidden border">
                  <img src={imageUrl} alt={`Foto de ${name || 'novo ponto'}`} className="w-full h-48 object-cover" />
                  <Button
                    type="button"
                    size="icon"
                    variant="secondary"
                    onClick={() => setValue('imageUrl', null)}
                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow"
                    aria-label="Remover foto"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="w-full h-32 rounded-xl border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex flex-col items-center justify-center text-muted-foreground"
                  aria-label="Enviar foto do ponto"
                >
                  {uploading ? (
                    <Loader2 className="w-6 h-6 mb-2 animate-spin" />
                  ) : (
                    <ImagePlus className="w-6 h-6 mb-2" />
                  )}
                  <span className="text-sm">
                    {uploading ? 'Enviando...' : 'Toque para enviar uma foto'}
                  </span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(e) => {
                  const f = e.target.files?.[0]
                  if (f) handleUpload(f)
                  e.target.value = ''
                }}
              />
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm font-medium">
                Nome *
              </Label>
              <Input
                id="name"
                {...register('name')}
                placeholder="Ex: Jabuticabeira da esquina"
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Type */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo *</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(POINT_TYPE_META) as PointType[]).map((t) => {
                  const meta = POINT_TYPE_META[t]
                  const active = type === t
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setValue('type', t)}
                      aria-pressed={active}
                      className={`rounded-xl border p-3 flex flex-col items-center gap-1 transition-all relative ${
                        active
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                          : 'border-border hover:border-primary/30'
                      }`}
                    >
                      <span className="text-2xl" aria-hidden>
                        {meta.emoji}
                      </span>
                      <span className="text-xs font-medium">{meta.label}</span>
                      {active && (
                        <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-primary-foreground" />
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Has fruit today */}
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">Tem fruto / flora hoje?</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Marque se a planta está produzindo no momento do registro.
                    </p>
                  </div>
                </div>
                <Switch
                  checked={hasFruit}
                  onCheckedChange={(v) => setValue('hasFruit', v)}
                  aria-label="Marcar se tem fruto hoje"
                />
              </CardContent>
            </Card>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Descrição
              </Label>
              <Textarea
                id="description"
                {...register('description')}
                placeholder="Descreva a planta, altura, acesso, etc."
                rows={3}
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address" className="text-sm font-medium">
                Endereço / referência
              </Label>
              <Input
                id="address"
                {...register('address')}
                placeholder="Ex: Rua das Flores, 123 — altura do mercado"
                aria-invalid={!!errors.address}
              />
              {errors.address && (
                <p className="text-xs text-destructive">{errors.address.message}</p>
              )}
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">
                Observações
              </Label>
              <Textarea
                id="notes"
                {...register('notes')}
                placeholder="Notas internas: horário de coleta, cuidadores, etc."
                rows={2}
                aria-invalid={!!errors.notes}
              />
              {errors.notes && (
                <p className="text-xs text-destructive">{errors.notes.message}</p>
              )}
            </div>

            {/* Recorded at */}
            <div className="space-y-2">
              <Label htmlFor="recordedAt" className="text-sm font-medium">
                Data do registro
              </Label>
              <Input
                id="recordedAt"
                type="date"
                {...register('recordedAt')}
                aria-invalid={!!errors.recordedAt}
              />
              {errors.recordedAt && (
                <p className="text-xs text-destructive">{errors.recordedAt.message}</p>
              )}
            </div>

            {/* Summary chips */}
            <div className="flex flex-wrap gap-1.5 pt-2">
              <Badge variant="outline" className="text-xs">
                {POINT_TYPE_META[type].emoji} {POINT_TYPE_META[type].label}
              </Badge>
              {hasFruit && (
                <Badge className="text-xs bg-primary/10 text-primary border border-primary/20 hover:bg-primary/10">
                  🌱 Com frutos
                </Badge>
              )}
              {imageUrl && (
                <Badge variant="outline" className="text-xs">
                  📷 Com foto
                </Badge>
              )}
              {pickedLocation && (
                <Badge variant="outline" className="text-xs">
                  📍 Local definido
                </Badge>
              )}
            </div>
          </form>
        </div>

        <SheetFooter className="px-5 py-4 border-t gap-2 sm:gap-2 shrink-0">
          <Button
            variant="outline"
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="point-form"
            disabled={isSubmitting || uploading}
            className="flex-1"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
            {isEdit ? 'Salvar alterações' : 'Adicionar ponto'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
