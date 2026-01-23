import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, insert } from '@/lib/db'

// POST /api/manifests/[planId]/copy - Copy manifest to create a new plan
export async function POST(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params
    const body = await request.json()
    const { newVersion, newType, newSummary } = body

    // Get source plan
    const sourcePlan = await queryOne<any>(
      `SELECT * FROM plans WHERE id = ?`,
      [planId]
    )

    if (!sourcePlan) {
      return NextResponse.json(
        { success: false, error: '源计划不存在' },
        { status: 404 }
      )
    }

    // Get source components
    const sourceComponents = await query<any>(
      `SELECT * FROM plan_components WHERE plan_id = ?`,
      [planId]
    )

    // Check if new version already exists
    const existingPlan = await queryOne<any>(
      'SELECT * FROM plans WHERE version = ?',
      [newVersion]
    )

    if (existingPlan) {
      return NextResponse.json(
        { success: false, error: '目标版本号已存在' },
        { status: 400 }
      )
    }

    // Extract version line from version
    const versionParts = newVersion.split('.')
    const versionLine = `${versionParts[0]}.${versionParts[1]}`

    // Create new plan
    const newPlanId = Date.now().toString()
    await insert(
      `INSERT INTO plans (id, version, version_line, type, status, summary, related_requirements, related_bugs)
       VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)`,
      [
        newPlanId,
        newVersion,
        versionLine,
        newType || sourcePlan.type,
        newSummary || `从 ${sourcePlan.version} 复制`,
        sourcePlan.related_requirements || '[]',
        sourcePlan.related_bugs || '[]',
      ]
    )

    // Copy components
    for (const comp of sourceComponents) {
      await insert(
        `INSERT INTO plan_components (plan_id, component_name, component_type, current_version, target_version, enabled)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          newPlanId,
          comp.component_name,
          comp.component_type,
          comp.current_version,
          comp.target_version,
          comp.enabled,
        ]
      )
    }

    // Get the complete new plan
    const newPlan = await queryOne<any>(
      `SELECT * FROM plans WHERE id = ?`,
      [newPlanId]
    )

    return NextResponse.json({ success: true, data: newPlan })
  } catch (error: any) {
    console.error('Error copying manifest:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to copy manifest' },
      { status: 500 }
    )
  }
}
