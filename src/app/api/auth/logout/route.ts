import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { SESSION_COOKIE, destroySession, clearSessionCookie } from '@/lib/auth'

export async function POST() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (token) {
      await destroySession(token)
    }
    await clearSessionCookie()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[logout]', err)
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 })
  }
}
