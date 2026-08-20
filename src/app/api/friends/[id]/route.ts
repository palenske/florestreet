import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getUserFromRequest } from '@/lib/auth'

export async function PATCH(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await ctx.params
  const body = await req.json().catch(() => ({}))
  const action = body.action as 'accept' | 'decline' | undefined

  const friendship = await db.friendship.findUnique({ where: { id } })
  if (!friendship) {
    return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
  }
  if (friendship.receiverId !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }

  if (action === 'decline' || action === 'accept') {
    const updated = await db.friendship.update({
      where: { id },
      data: { status: action === 'accept' ? 'accepted' : 'declined' },
    })
    return NextResponse.json({ ok: true, status: updated.status })
  }

  return NextResponse.json({ error: 'Ação inválida' }, { status: 400 })
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const user = await getUserFromRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }
  const { id } = await ctx.params
  const friendship = await db.friendship.findUnique({ where: { id } })
  if (!friendship) {
    return NextResponse.json({ error: 'Solicitação não encontrada' }, { status: 404 })
  }
  if (friendship.requesterId !== user.id && friendship.receiverId !== user.id) {
    return NextResponse.json({ error: 'Sem permissão' }, { status: 403 })
  }
  await db.friendship.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
