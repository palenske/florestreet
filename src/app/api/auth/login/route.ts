import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createSession, setSessionCookie } from '@/lib/auth'
import { loginSchema } from '@/lib/schemas/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }

    const { email, password } = parsed.data
    const user = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (!user) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }
    const ok = await bcrypt.compare(password, user.passwordHash)
    if (!ok) {
      return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })
    }

    const token = await createSession(user.id)
    await setSessionCookie(token)

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, bio: user.bio },
    })
  } catch (err) {
    console.error('[login]', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
