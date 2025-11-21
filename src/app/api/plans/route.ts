import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/plans - List all plans with filters
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status')
    const type = searchParams.get('type')
    const search = searchParams.get('search')

    const where: any = {}

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    if (search) {
      where.OR = [
        { version: { contains: search } },
        { summary: { contains: search } },
      ]
    }

    const plans = await prisma.plan.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        manifest: {
          select: {
            frontendVersion: true,
            frontendChangeType: true,
          },
        },
        _count: {
          select: {
            regionVersions: true,
          },
        },
      },
    })

    return NextResponse.json({ success: true, data: plans })
  } catch (error) {
    console.error('Error fetching plans:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plans' },
      { status: 500 }
    )
  }
}

// POST /api/plans - Create new plan
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { version, type, summary, relatedRequirements, relatedBugs } = body

    if (!version || !type || !summary) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    // Check if version already exists
    const existing = await prisma.plan.findUnique({
      where: { version },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: '该版本号已存在' },
        { status: 400 }
      )
    }

    // Extract version line from version (e.g., "25.8" from "25.8.1")
    const versionParts = version.split('.')
    const versionLine = `${versionParts[0]}.${versionParts[1]}`

    const plan = await prisma.plan.create({
      data: {
        version,
        versionLine,
        type,
        summary,
        status: 'draft',
        relatedRequirements: JSON.stringify(relatedRequirements || []),
        relatedBugs: JSON.stringify(relatedBugs || []),
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'plan',
        entityId: plan.id,
        action: 'create',
        newValue: JSON.stringify(plan),
        operator: 'system',
      },
    })

    return NextResponse.json({ success: true, data: plan })
  } catch (error) {
    console.error('Error creating plan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create plan' },
      { status: 500 }
    )
  }
}
