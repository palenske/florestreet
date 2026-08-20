import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'

const shareSchema = z.object({
  friendId: z.string().min(1),
})

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await ctx.params
  const body = await req.json()
  const parsed = shareSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'friendId é obrigatório' }, { status: 400 })
  }
  const { friendId } = parsed.data

  if (friendId === user.id) {
    return NextResponse.json({ error: 'Você não pode compartilhar com você mesmo' }, { status: 400 })
  }

  const point = await db.collectionPoint.findUnique({ where: { id } })
  if (!point) {
    return NextResponse.json({ error: 'Ponto não encontrado' }, { status: 404 })
  }
  if (point.userId !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  // Verify they are friends
  const friendship = await db.friendship.findFirst({
    where: {
      status: 'accepted',
      OR: [
        { requesterId: user.id, receiverId: friendId },
        { receiverId: user.id, requesterId: friendId },
      ],
    },
  })
  if (!friendship) {
    return NextResponse.json({ error: 'Vocês não são amigos' }, { status: 403 })
  }

  try {
    await db.sharedPoint.upsert({
      where: { pointId_sharedWithId: { pointId: id, sharedWithId: friendId } },
      create: { pointId: id, sharedById: user.id, sharedWithId: friendId },
      update: {},
    })
  } catch {
    // Already exists - that's fine
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await ctx.params
  const url = new URL(req.url)
  const friendId = url.searchParams.get('friendId')
  if (!friendId) {
    return NextResponse.json({ error: 'friendId é obrigatório' }, { status: 400 })
  }

  await db.sharedPoint
    .delete({
      where: { pointId_sharedWithId: { pointId: id, sharedWithId: friendId } },
    })
    .catch(() => {})

  return NextResponse.json({ ok: true })
}
