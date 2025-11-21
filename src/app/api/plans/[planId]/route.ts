import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/plans/[planId] - Get plan details
export async function GET(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params

    const plan = await prisma.plan.findUnique({
      where: { id: planId },
      include: {
        manifest: {
          include: {
            components: {
              orderBy: { componentName: 'asc' },
            },
          },
        },
        regionVersions: {
          include: {
            region: true,
          },
        },
      },
    })

    if (!plan) {
      return NextResponse.json(
        { success: false, error: '版本计划不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: plan })
  } catch (error) {
    console.error('Error fetching plan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch plan' },
      { status: 500 }
    )
  }
}

// PUT /api/plans/[planId] - Update plan
export async function PUT(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params
    const body = await request.json()
    const { summary, relatedRequirements, relatedBugs } = body

    const existingPlan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { success: false, error: '版本计划不存在' },
        { status: 404 }
      )
    }

    const plan = await prisma.plan.update({
      where: { id: planId },
      data: {
        summary,
        relatedRequirements: JSON.stringify(relatedRequirements || []),
        relatedBugs: JSON.stringify(relatedBugs || []),
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'plan',
        entityId: plan.id,
        action: 'update',
        oldValue: JSON.stringify(existingPlan),
        newValue: JSON.stringify(plan),
        operator: 'system',
      },
    })

    return NextResponse.json({ success: true, data: plan })
  } catch (error) {
    console.error('Error updating plan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update plan' },
      { status: 500 }
    )
  }
}

// DELETE /api/plans/[planId] - Delete plan (logical delete by setting status to deprecated)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params

    const existingPlan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!existingPlan) {
      return NextResponse.json(
        { success: false, error: '版本计划不存在' },
        { status: 404 }
      )
    }

    const plan = await prisma.plan.update({
      where: { id: planId },
      data: { status: 'deprecated' },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'plan',
        entityId: plan.id,
        action: 'delete',
        oldValue: existingPlan.status,
        newValue: 'deprecated',
        field: 'status',
        operator: 'system',
      },
    })

    return NextResponse.json({ success: true, data: plan })
  } catch (error) {
    console.error('Error deleting plan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete plan' },
      { status: 500 }
    )
  }
}
