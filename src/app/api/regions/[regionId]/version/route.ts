import { NextRequest, NextResponse } from 'next/server'
import { queryOne, insert, update } from '@/lib/db'

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

// PATCH /api/regions/[regionId]/version - Update region's current version
export async function PATCH(
  request: NextRequest,
  { params }: { params: { regionId: string } }
) {
  try {
    const { regionId } = params
    const body = await request.json()
    const { planId, backendReady, frontendReady } = body

    // Check if region exists and get current version
    const region = await queryOne(
      `SELECT r.*,
              rv.id as current_version_id,
              rv.plan_id as current_plan_id,
              rv.backend_ready as current_backend_ready,
              rv.frontend_ready as current_frontend_ready,
              rv.updated_at as current_updated_at,
              p.id as plan_id,
              p.version as plan_version,
              p.version_line as plan_version_line,
              p.type as plan_type,
              p.status as plan_status,
              p.summary as plan_summary
       FROM regions r
       LEFT JOIN region_versions rv ON r.id = rv.region_id
       LEFT JOIN plans p ON rv.plan_id = p.id
       WHERE r.id = ?`,
      [regionId]
    )

    if (!region) {
      return NextResponse.json(
        { success: false, error: '局点不存在' },
        { status: 404 }
      )
    }

    // Check if plan exists if provided
    if (planId) {
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
    }

    // Get old version info for audit log
    const oldPlanId = region.currentPlanId || null

    // Update or create region version
    let regionVersion: any = null

    if (region.currentVersionId) {
      // Update existing region version
      const updateFields: string[] = []
      const updateValues: any[] = []

      if (planId !== undefined) {
        updateFields.push('plan_id = ?')
        updateValues.push(planId)
      }
      if (typeof backendReady === 'boolean') {
        updateFields.push('backend_ready = ?')
        updateValues.push(backendReady)
      }
      if (typeof frontendReady === 'boolean') {
        updateFields.push('frontend_ready = ?')
        updateValues.push(frontendReady)
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = NOW()')
        updateValues.push(regionId)

        await update(
          `UPDATE region_versions SET ${updateFields.join(', ')} WHERE region_id = ?`,
          updateValues
        )
      }

      // Fetch updated region version with plan
      regionVersion = await queryOne(
        `SELECT rv.*,
                p.id as plan_id,
                p.version as plan_version,
                p.version_line as plan_version_line,
                p.type as plan_type,
                p.status as plan_status,
                p.summary as plan_summary
         FROM region_versions rv
         LEFT JOIN plans p ON rv.plan_id = p.id
         WHERE rv.region_id = ?`,
        [regionId]
      )
    } else if (planId) {
      // Create new region version
      const newId = await insert(
        `INSERT INTO region_versions (region_id, plan_id, backend_ready, frontend_ready, updated_at)
         VALUES (?, ?, ?, ?, NOW())`,
        [regionId, planId, backendReady ?? false, frontendReady ?? false]
      )

      // Fetch created region version with plan
      regionVersion = await queryOne(
        `SELECT rv.*,
                p.id as plan_id,
                p.version as plan_version,
                p.version_line as plan_version_line,
                p.type as plan_type,
                p.status as plan_status,
                p.summary as plan_summary
         FROM region_versions rv
         LEFT JOIN plans p ON rv.plan_id = p.id
         WHERE rv.id = ?`,
        [newId]
      )
    }

    // Create audit log
    await insert(
      `INSERT INTO audit_logs (entity_type, entity_id, action, field, old_value, new_value, operator, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        'region',
        regionId,
        'update',
        'version',
        oldPlanId,
        regionVersion?.planId || null,
        'system'
      ]
    )

    return NextResponse.json({ success: true, data: toCamelCase(regionVersion) })
  } catch (error) {
    console.error('Error updating region version:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update region version' },
      { status: 500 }
    )
  }
}
