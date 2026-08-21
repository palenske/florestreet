import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { updatePointSchema } from '@/lib/schemas/point'

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await ctx.params
  const point = await db.collectionPoint.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, avatar: true } },
      shares: true,
    },
  })
  if (!point) {
    return NextResponse.json({ error: 'Ponto não encontrado' }, { status: 404 })
  }
  const isOwner = point.userId === user.id
  const isShared = point.shares.some((s) => s.sharedWithId === user.id)
  if (!isOwner && !isShared) {
    // also allow if friend
    const fr = await db.friendship.findFirst({
      where: {
        status: 'accepted',
        OR: [
          { requesterId: user.id, receiverId: point.userId },
          { receiverId: user.id, requesterId: point.userId },
        ],
      },
    })
    if (!fr) {
      return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
    }
  }

  return NextResponse.json({
    point: {
      id: point.id,
      name: point.name,
      description: point.description,
      type: point.type,
      hasFruit: point.hasFruit,
      imageUrl: point.imageUrl,
      latitude: point.latitude,
      longitude: point.longitude,
      address: point.address,
      notes: point.notes,
      recordedAt: point.recordedAt.toISOString(),
      createdAt: point.createdAt.toISOString(),
      updatedAt: point.updatedAt.toISOString(),
      ownerId: point.userId,
      ownerName: point.user.name,
      ownerAvatar: point.user.avatar,
      sharedWithMe: isShared,
    },
  })
}

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await ctx.params
  const existing = await db.collectionPoint.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Ponto não encontrado' }, { status: 404 })
  }
  if (existing.userId !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  const body = await req.json()
  const parsed = updatePointSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
      { status: 400 }
    )
  }
  const d = parsed.data

  const updated = await db.collectionPoint.update({
    where: { id },
    data: {
      ...(d.name !== undefined && { name: d.name }),
      ...(d.description !== undefined && { description: d.description }),
      ...(d.type !== undefined && { type: d.type }),
      ...(d.hasFruit !== undefined && { hasFruit: d.hasFruit }),
      ...(d.imageUrl !== undefined && { imageUrl: d.imageUrl }),
      ...(d.latitude !== undefined && { latitude: d.latitude }),
      ...(d.longitude !== undefined && { longitude: d.longitude }),
      ...(d.address !== undefined && { address: d.address }),
      ...(d.notes !== undefined && { notes: d.notes }),
      ...(d.recordedAt !== undefined && { recordedAt: new Date(d.recordedAt) }),
    },
    include: { user: { select: { name: true, avatar: true } } },
  })

  return NextResponse.json({ point: updated })
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await ctx.params
  const existing = await db.collectionPoint.findUnique({ where: { id } })
  if (!existing) {
    return NextResponse.json({ error: 'Ponto não encontrado' }, { status: 404 })
  }
  if (existing.userId !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  await db.collectionPoint.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
