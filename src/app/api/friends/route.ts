import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'
import { z } from 'zod'
import type { FriendDTO } from '@/lib/types'

function serializeFriend(
  f: {
    id: string
    status: string
    requesterId: string
    receiverId: string
    requester: { id: string; name: string; email: string; avatar: string | null; bio: string | null }
    receiver: { id: string; name: string; email: string; avatar: string | null; bio: string | null }
  },
  currentUserId: string,
  pointsCount?: number
): FriendDTO {
  const isRequester = f.requesterId === currentUserId
  const other = isRequester ? f.receiver : f.requester
  return {
    id: other.id,
    name: other.name,
    email: other.email,
    avatar: other.avatar,
    bio: other.bio,
    friendshipId: f.id,
    status: f.status as FriendDTO['status'],
    direction: isRequester ? 'outgoing' : 'incoming',
    pointsCount,
  }
}

export async function GET() {
  const user = await getUserFromRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const friendships = await db.friendship.findMany({
    where: {
      OR: [{ requesterId: user.id }, { receiverId: user.id }],
    },
    include: {
      requester: { select: { id: true, name: true, email: true, avatar: true, bio: true } },
      receiver: { select: { id: true, name: true, email: true, avatar: true, bio: true } },
    },
    orderBy: { updatedAt: 'desc' },
  })

  // Count points per friend (only accepted)
  const accepted = friendships.filter((f) => f.status === 'accepted')
  const counts = await Promise.all(
    accepted.map(async (f) => {
      const otherId = f.requesterId === user.id ? f.receiverId : f.requesterId
      const c = await db.collectionPoint.count({ where: { userId: otherId } })
      return { friendId: otherId, count: c }
    })
  )
  const countMap = new Map(counts.map((c) => [c.friendId, c.count]))

  const friends = friendships.map((f) =>
    serializeFriend(f, user.id, countMap.get(f.requesterId === user.id ? f.receiverId : f.requesterId))
  )

  return NextResponse.json({ friends })
}

const requestSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  const user = await getUserFromRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const body = await req.json()
  const parsed = requestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'E-mail inválido' }, { status: 400 })
  }
  const { email } = parsed.data

  const target = await db.user.findUnique({ where: { email: email.toLowerCase() } })
  if (!target) {
    return NextResponse.json({ error: 'Usuário não encontrado' }, { status: 404 })
  }
  if (target.id === user.id) {
    return NextResponse.json({ error: 'Você não pode adicionar a si mesmo' }, { status: 400 })
  }

  // Check existing
  const existing = await db.friendship.findFirst({
    where: {
      OR: [
        { requesterId: user.id, receiverId: target.id },
        { requesterId: target.id, receiverId: user.id },
      ],
    },
  })
  if (existing) {
    if (existing.status === 'accepted') {
      return NextResponse.json({ error: 'Vocês já são amigos' }, { status: 409 })
    }
    if (existing.status === 'pending' && existing.requesterId === user.id) {
      return NextResponse.json({ error: 'Solicitação já enviada' }, { status: 409 })
    }
    if (existing.status === 'pending' && existing.requesterId === target.id) {
      // Auto-accept if they requested us
      await db.friendship.update({
        where: { id: existing.id },
        data: { status: 'accepted' },
      })
      return NextResponse.json({ ok: true, autoAccepted: true })
    }
    if (existing.status === 'declined') {
      // Reactivate
      await db.friendship.update({
        where: { id: existing.id },
        data: { status: 'pending', requesterId: user.id, receiverId: target.id },
      })
      return NextResponse.json({ ok: true })
    }
  }

  await db.friendship.create({
    data: { requesterId: user.id, receiverId: target.id, status: 'pending' },
  })

  return NextResponse.json({ ok: true })
}
