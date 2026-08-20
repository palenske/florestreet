import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function GET() {
  const user = await getUserFromRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const [myPoints, friendsCount, sharedWithMe, pendingRequests] = await Promise.all([
    db.collectionPoint.count({ where: { userId: user.id } }),
    db.friendship.count({
      where: {
        status: 'accepted',
        OR: [{ requesterId: user.id }, { receiverId: user.id }],
      },
    }),
    db.sharedPoint.count({ where: { sharedWithId: user.id } }),
    db.friendship.count({
      where: { receiverId: user.id, status: 'pending' },
    }),
  ])

  const byType = await db.collectionPoint.groupBy({
    by: ['type'],
    where: { userId: user.id },
    _count: true,
  })

  const fruiting = await db.collectionPoint.count({
    where: { userId: user.id, hasFruit: true },
  })

  return NextResponse.json({
    myPoints,
    friendsCount,
    sharedWithMe,
    pendingRequests,
    fruiting,
    byType: byType.reduce<Record<string, number>>((acc, t) => {
      acc[t.type] = t._count
      return acc
    }, {}),
  })
}
