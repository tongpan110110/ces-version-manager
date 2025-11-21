import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// PATCH /api/plans/[planId]/status - Update plan status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params
    const body = await request.json()
    const { status } = body

    const validStatuses = ['draft', 'testing', 'ready', 'released', 'deprecated']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: '无效的状态值' },
        { status: 400 }
      )
    }

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
      data: { status },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'plan',
        entityId: plan.id,
        action: 'status_change',
        field: 'status',
        oldValue: existingPlan.status,
        newValue: status,
        operator: 'system',
      },
    })

    return NextResponse.json({ success: true, data: plan })
  } catch (error) {
    console.error('Error updating plan status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update plan status' },
      { status: 500 }
    )
  }
}
