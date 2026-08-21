import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { createSession, setSessionCookie } from '@/lib/auth'
import { signupSchema } from '@/lib/schemas/auth'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = signupSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? 'Dados inválidos' },
        { status: 400 }
      )
    }

    const { name, email, password } = parsed.data
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } })
    if (existing) {
      return NextResponse.json({ error: 'E-mail já cadastrado' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 10)
    const user = await db.user.create({
      data: { name, email: email.toLowerCase(), passwordHash },
    })

    const token = await createSession(user.id)
    await setSessionCookie(token)

    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, avatar: user.avatar, bio: user.bio },
    })
  } catch (err) {
    console.error('[signup]', err)
    return NextResponse.json({ error: 'Erro interno no servidor' }, { status: 500 })
  }
}
