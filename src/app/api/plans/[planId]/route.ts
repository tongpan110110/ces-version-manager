import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query, insert, update } from '@/lib/db'

// Helper function to convert snake_case to camelCase
function toCamelCase(obj: any): any {
  if (obj === null || obj === undefined) return obj
  if (Array.isArray(obj)) return obj.map(toCamelCase)
  if (typeof obj !== 'object') return obj

  const result: any = {}
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      result[camelKey] = toCamelCase(obj[key])
    }
  }
  return result
}

// Helper function to convert plan database row to API response format
function formatPlan(plan: any, manifest: any = null, components: any[] = [], regionVersions: any[] = []) {
  return {
    id: plan.id,
    version: plan.version,
    versionLine: plan.version_line,
    type: plan.type,
    status: plan.status,
    summary: plan.summary,
    relatedRequirements: plan.related_requirements ? JSON.parse(plan.related_requirements) : [],
    relatedBugs: plan.related_bugs ? JSON.parse(plan.related_bugs) : [],
    createdAt: plan.created_at,
    updatedAt: plan.updated_at,
    manifest: manifest ? {
      ...toCamelCase(manifest),
      components: components.map(toCamelCase)
    } : null,
    regionVersions: regionVersions.map((rv: any) => ({
      id: rv.id,
      regionId: rv.region_id,
      planId: rv.plan_id,
      backendReady: rv.backend_ready,
      frontendReady: rv.frontend_ready,
      updatedAt: rv.updated_at,
      region: {
        id: rv.r_id,
        name: rv.r_name,
        area: rv.r_area,
        backendVersion: rv.r_backend_version,
        frontendVersion: rv.r_frontend_version,
        targetVersion: rv.r_target_version,
        backendReady: rv.r_backend_ready,
        frontendReady: rv.r_frontend_ready,
        isGray: rv.r_is_gray
      }
    }))
  }
}

// GET /api/plans/[planId] - Get plan details
export async function GET(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params

    const plan = await queryOne(
      'SELECT * FROM plans WHERE id = ?',
      [planId]
    )

    if (!plan) {
      return NextResponse.json(
        { success: false, error: '版本计划不存在' },
        { status: 404 }
      )
    }

    // Fetch manifest with components (使用 plan_components 表)
    const components = await query(
      'SELECT * FROM plan_components WHERE plan_id = ? ORDER BY component_name ASC',
      [planId]
    )

    // 获取计划时间线
    const timelines = await query(
      'SELECT * FROM plan_timelines WHERE plan_id = ?',
      [planId]
    )

    // 获取升级窗口
    const upgradeWindow = await queryOne(
      'SELECT * FROM upgrade_windows WHERE plan_id = ?',
      [planId]
    )

    // 获取延期原因
    const delays = await query(
      'SELECT * FROM plan_delays WHERE plan_id = ?',
      [planId]
    )

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
      updatedAt: plan.updated_at,
      components: components.map((c: any) => ({
        name: c.component_name,
        type: c.component_type,
        currentVersion: c.current_version,
        targetVersion: c.target_version,
        enabled: c.enabled === 1,
      })),
      timelines: timelines.reduce((acc: any, t: any) => {
        acc[t.timeline_key] = {
          planned: t.planned_date,
          actual: t.actual_date,
        }
        return acc
      }, {}),
      upgradeWindow: upgradeWindow ? {
        plannedStart: upgradeWindow.planned_start_date,
        plannedEnd: upgradeWindow.planned_end_date,
        actualStart: upgradeWindow.actual_start_date,
        actualEnd: upgradeWindow.actual_end_date,
      } : null,
      delays: delays.reduce((acc: any, d: any) => {
        acc[d.delay_key] = {
          type: d.delay_type,
          reason: d.delay_reason,
          owner: d.owner,
          recordedAt: d.recorded_at,
        }
        return acc
      }, {}),
    }

    return NextResponse.json({ success: true, data: responseData })
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
      `UPDATE plans
       SET summary = ?, related_requirements = ?, related_bugs = ?
       WHERE id = ?`,
      [
        summary,
        JSON.stringify(relatedRequirements || []),
        JSON.stringify(relatedBugs || []),
        planId
      ]
    )

    // Fetch updated plan
    const plan = await queryOne(
      'SELECT * FROM plans WHERE id = ?',
      [planId]
    )

    // Create audit log
    await insert(
      `INSERT INTO audit_logs (entity_type, entity_id, action, old_value, new_value, operator, created_at)
       VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        'plan',
        planId,
        'update',
        JSON.stringify(existingPlan),
        JSON.stringify(plan),
        'system'
      ]
    )

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
      ['deprecated', planId]
    )

    // Fetch updated plan
    const plan = await queryOne(
      'SELECT * FROM plans WHERE id = ?',
      [planId]
    )

    // Create audit log
    await insert(
      `INSERT INTO audit_logs (entity_type, entity_id, action, field, old_value, new_value, operator, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        'plan',
        planId,
        'delete',
        'status',
        existingPlan.status,
        'deprecated',
        'system'
      ]
    )

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
    console.error('Error deleting plan:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete plan' },
      { status: 500 }
    )
  }
}
