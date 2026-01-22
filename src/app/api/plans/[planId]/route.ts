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

    // Fetch manifest with components
    let manifest: any = null
    let components: any[] = []

    const manifestData = await queryOne(
      'SELECT * FROM manifests WHERE plan_id = ?',
      [planId]
    )

    if (manifestData) {
      manifest = manifestData
      components = await query(
        'SELECT * FROM manifest_components WHERE manifest_id = ? ORDER BY component_name ASC',
        [manifest.id]
      )
    }

    // Fetch region versions with regions
    const regionVersions = await query(
      `SELECT rv.*,
              r.id as r_id,
              r.name as r_name,
              r.area as r_area,
              r.backend_version as r_backend_version,
              r.frontend_version as r_frontend_version,
              r.target_version as r_target_version,
              r.backend_ready as r_backend_ready,
              r.frontend_ready as r_front_ready,
              r.is_gray as r_is_gray
       FROM region_versions rv
       JOIN regions r ON rv.region_id = r.id
       WHERE rv.plan_id = ?`,
      [planId]
    )

    const responseData = formatPlan(plan, manifest, components, regionVersions)

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
