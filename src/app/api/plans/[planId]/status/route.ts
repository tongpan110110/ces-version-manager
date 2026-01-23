import { NextRequest, NextResponse } from 'next/server'
import { queryOne, update } from '@/lib/db'

// PATCH /api/plans/[planId]/status - Update plan status
export async function PATCH(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params
    const body = await request.json()
    const { status } = body

    const validStatuses = ['draft', 'testing', 'ready', 'released', 'upgrading', 'completed', 'deprecated']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { success: false, error: '无效的状态值' },
        { status: 400 }
      )
    }

    const existingPlan = await queryOne(
      'SELECT * FROM plans WHERE id = ?',
      [planId]
    )

    if (!existingPlan) {
      return NextResponse.json(
        { success: false, error: '版本计划不存在' },
        { status: 404 }
      )
    }

    await update(
      'UPDATE plans SET status = ? WHERE id = ?',
      [status, planId]
    )

    // Fetch updated plan
    const plan = await queryOne(
      'SELECT * FROM plans WHERE id = ?',
      [planId]
    )

    // Convert snake_case to camelCase for response
    const responseData = {
      id: plan.id,
      version: plan.version,
      versionLine: plan.version_line,
      type: plan.type,
      status: plan.status,
      summary: plan.summary,
      relatedRequirements: plan.related_requirements ? JSON.parse(plan.related_requirements) : [],
      relatedBugs: plan.related_bugs ? JSON.parse(plan.related_bugs) : [],
      createdAt: plan.created_at,
      updatedAt: plan.updated_at
    }

    return NextResponse.json({ success: true, data: responseData })
  } catch (error) {
    console.error('Error updating plan status:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update plan status' },
      { status: 500 }
    )
  }
}
