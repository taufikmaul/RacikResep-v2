import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    return NextResponse.json({
      hasSession: !!session,
      session: session ? {
        user: {
          id: session.user?.id,
          email: session.user?.email,
          name: session.user?.name,
          hasBusiness: !!session.user?.business
        }
      } : null
    })
  } catch (error) {
    console.error('Session debug error:', error)
    return NextResponse.json(
      { error: 'Session check failed', details: error },
      { status: 500 }
    )
  }
}
