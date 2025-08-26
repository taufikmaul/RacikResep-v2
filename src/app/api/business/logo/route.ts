import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const contentType = request.headers.get('content-type') || ''
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'Invalid content type' }, { status: 400 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'No file uploaded' }, { status: 400 })

    if (!file.type.startsWith('image/')) {
      return NextResponse.json({ error: 'Only image files are allowed' }, { status: 400 })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    // Store as data URL in DB for simplicity
    const base64 = buffer.toString('base64')
    const dataUrl = `data:${file.type};base64,${base64}`

    // Find business id
    const user = await prisma.user.findUnique({ where: { id: session.user.id }, include: { business: true } })
    if (!user?.business?.id) return NextResponse.json({ error: 'Business not found' }, { status: 404 })

    const updated = await prisma.business.update({
      where: { id: user.business.id },
      data: { logo: dataUrl },
      select: { id: true, logo: true }
    })

    await prisma.activityLog.create({
      data: {
        action: 'Upload Logo',
        description: 'Business logo updated',
        entityType: 'business',
        entityId: updated.id,
        userId: session.user.id,
      }
    })

    return NextResponse.json({ logo: updated.logo })
  } catch (error) {
    console.error('Error uploading logo:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
