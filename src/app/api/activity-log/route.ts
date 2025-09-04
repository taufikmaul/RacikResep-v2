import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = (session.user as any).id

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const action = searchParams.get('action') || ''

    const skip = (page - 1) * limit

    // Build where clause
    const where: {
      userId: string
      description?: { contains: string; mode: 'insensitive' }
      action?: string
    } = {
      userId
    }

    if (search) {
      where.description = {
        contains: search,
        mode: 'insensitive'
      }
    }

    if (action) {
      where.action = action
    }

    // Get total count for pagination
    const totalCount = await prisma.activityLog.count({ where })

    // Get activity logs with pagination
    const activities = await prisma.activityLog.findMany({
      where,
      select: {
        id: true,
        action: true,
        description: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit
    })

    // Get unique actions for filter dropdown
    const uniqueActions = await prisma.activityLog.findMany({
      where: { userId },
      select: { action: true },
      distinct: ['action'],
      orderBy: { action: 'asc' }
    })

    const totalPages = Math.ceil(totalCount / limit)

    return NextResponse.json({
      activities: activities.map(activity => ({
        ...activity,
        createdAt: activity.createdAt.toISOString()
      })),
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: {
        actions: uniqueActions.map(item => item.action)
      }
    })
  } catch (error) {
    console.error('Error fetching activity logs:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
