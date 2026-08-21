import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { createPointSchema } from '@/lib/schemas/point'
import type { CollectionPointDTO, PointType } from '@/lib/types'

function serialize(p: {
  id: string
  name: string
  description: string | null
  type: string
  hasFruit: boolean
  imageUrl: string | null
  latitude: number
  longitude: number
  address: string | null
  notes: string | null
  recordedAt: Date
  createdAt: Date
  updatedAt: Date
  userId: string
  user: { name: string; avatar: string | null }
  shares?: { sharedWithId: string }[]
}): CollectionPointDTO {
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    type: p.type as PointType,
    hasFruit: p.hasFruit,
    imageUrl: p.imageUrl,
    latitude: p.latitude,
    longitude: p.longitude,
    address: p.address,
    notes: p.notes,
    recordedAt: p.recordedAt.toISOString(),
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
    ownerId: p.userId,
    ownerName: p.user.name,
    ownerAvatar: p.user.avatar,
    sharedWithMe: p.shares?.some((s) => s.sharedWithId !== '') ?? false,
  }
}

export async function GET(req: Request) {
  const user = await getUserFromRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const url = new URL(req.url)
  const scope = url.searchParams.get('scope') ?? 'mine' // mine | friends | all

  if (scope === 'mine') {
    const points = await db.collectionPoint.findMany({
      where: { userId: user.id },
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    })
    return NextResponse.json({ points: points.map(serialize) })
  }

  if (scope === 'friends') {
    // Points shared with me by accepted friends
    const friendships = await db.friendship.findMany({
      where: {
        OR: [
          { requesterId: user.id, status: 'accepted' },
          { receiverId: user.id, status: 'accepted' },
        ],
      },
      select: { requesterId: true, receiverId: true },
    })
    const friendIds = new Set<string>()
    friendships.forEach((f) => {
      if (f.requesterId === user.id) friendIds.add(f.receiverId)
      else friendIds.add(f.requesterId)
    })

    const shared = await db.sharedPoint.findMany({
      where: { sharedWithId: user.id },
      include: {
        point: {
          include: { user: { select: { name: true, avatar: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    const points = shared
      .map((s) => serialize({ ...s.point, shares: [{ sharedWithId: user.id }] }))
      // mark as shared
      .map((p) => ({ ...p, sharedWithMe: true }))

    // Also include public points from friends (not only those explicitly shared)
    const friendPoints = await db.collectionPoint.findMany({
      where: { userId: { in: Array.from(friendIds) } },
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    })

    const merged = new Map<string, CollectionPointDTO>()
    points.forEach((p) => merged.set(p.id, { ...p, sharedWithMe: true }))
    friendPoints.forEach((p) => {
      if (!merged.has(p.id)) {
        merged.set(p.id, { ...serialize(p), sharedWithMe: false })
      }
    })

    return NextResponse.json({ points: Array.from(merged.values()) })
  }

  // all = mine + friends shared
  const [mine, friendsRes] = await Promise.all([
    db.collectionPoint.findMany({
      where: { userId: user.id },
      include: { user: { select: { name: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    db.sharedPoint.findMany({
      where: { sharedWithId: user.id },
      include: {
        point: {
          include: { user: { select: { name: true, avatar: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  const merged = new Map<string, CollectionPointDTO>()
  mine.forEach((p) => merged.set(p.id, serialize(p)))
  friendsRes.forEach((s) => {
    if (!merged.has(s.point.id)) {
      merged.set(s.point.id, { ...serialize(s.point), sharedWithMe: true })
    }
  })

  return NextResponse.json({ points: Array.from(merged.values()) })
}

export async function POST(req: Request) {
  const user = await getUserFromRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const body = await req.json()
  const parsed = createPointSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
      { status: 400 }
    )
  }
  const d = parsed.data

  const point = await db.collectionPoint.create({
    data: {
      name: d.name,
      description: d.description ?? null,
      type: d.type,
      hasFruit: d.hasFruit,
      imageUrl: d.imageUrl ?? null,
      latitude: d.latitude,
      longitude: d.longitude,
      address: d.address ?? null,
      notes: d.notes ?? null,
      recordedAt: d.recordedAt ? new Date(d.recordedAt) : new Date(),
      userId: user.id,
    },
    include: { user: { select: { name: true, avatar: true } } },
  })

  return NextResponse.json({ point: serialize(point) })
}
