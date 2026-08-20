import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET(req: Request) {
  const user = await getUserFromRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const url = new URL(req.url)
  const q = url.searchParams.get('q')?.trim().toLowerCase() ?? ''
  if (q.length < 2) {
    return NextResponse.json({ users: [] })
  }

  const users = await db.user.findMany({
    where: {
      AND: [
        { id: { not: user.id } },
        {
          OR: [
            { email: { contains: q } },
            { name: { contains: q } },
          ],
        },
      ],
    },
    select: { id: true, name: true, email: true, avatar: true },
    take: 10,
  })

  // attach friendship status
  const friendships = await db.friendship.findMany({
    where: {
      OR: [{ requesterId: user.id }, { receiverId: user.id }],
    },
    select: {
      requesterId: true,
      receiverId: true,
      status: true,
    },
  })
  const statusMap = new Map<string, string>()
  friendships.forEach((f) => {
    const other = f.requesterId === user.id ? f.receiverId : f.requesterId
    statusMap.set(other, f.status)
  })

  const result = users.map((u) => ({
    ...u,
    friendshipStatus: statusMap.get(u.id) ?? null,
  }))

  return NextResponse.json({ users: result })
}
