import { db } from '@/lib/db'
import { cookies } from 'next/headers'
import crypto from 'crypto'

export const SESSION_COOKIE = 'ff_session'
export const SESSION_DURATION_MS = 1000 * 60 * 60 * 24 * 30 // 30 days

export async function createSession(userId: string): Promise<string> {
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS)
  await db.session.create({
    data: { token, userId, expiresAt },
  })
  return token
}

export async function destroySession(token: string): Promise<void> {
  try {
    await db.session.delete({ where: { token } })
  } catch {
    // ignore - session may not exist
  }
}

export async function getUserFromRequest(): Promise<{
  id: string
  email: string
  name: string
  avatar: string | null
  bio: string | null
} | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null

    const session = await db.session.findUnique({
      where: { token },
      include: { user: true },
    })
    if (!session) return null
    if (session.expiresAt.getTime() < Date.now()) {
      await db.session.delete({ where: { id: session.id } }).catch(() => {})
      return null
    }
    return {
      id: session.user.id,
      email: session.user.email,
      name: session.user.name,
      avatar: session.user.avatar,
      bio: session.user.bio,
    }
  } catch {
    return null
  }
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires: new Date(Date.now() + SESSION_DURATION_MS),
  })
}

export async function clearSessionCookie() {
  const cookieStore = await cookies()
  cookieStore.delete(SESSION_COOKIE)
}
