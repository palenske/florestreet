import { NextResponse } from 'next/server'
import { upload } from '@vercel/blob'
import { getUserFromRequest } from '@/lib/auth'

export async function POST(req: Request) {
  const user = await getUserFromRequest()
  if (!user) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) {
    return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 })
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: 'Tipo de arquivo não permitido. Use JPEG, PNG, WebP ou GIF' },
      { status: 400 }
    )
  }

  const maxSize = 5 * 1024 * 1024 // 5MB
  if (file.size > maxSize) {
    return NextResponse.json(
      { error: 'Arquivo muito grande. Máximo 5MB' },
      { status: 400 }
    )
  }

  try {
    const extension = file.name.split('.').pop() || 'jpg'
    const filename = `${user.id}/${Date.now()}.${extension}`

    const blob = await upload(filename, file, {
      access: 'public',
    })

    return NextResponse.json({ url: blob.url })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: 'Erro ao fazer upload' },
      { status: 500 }
    )
  }
}
