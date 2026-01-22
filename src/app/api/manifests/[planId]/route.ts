import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, insert, update, remove } from '@/lib/db'

// GET /api/manifests/[planId] - Get manifest for a plan
export async function GET(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params

    const manifest = await queryOne<any>(
      `SELECT * FROM manifests WHERE plan_id = ?`,
      [planId]
    )

    if (!manifest) {
      return NextResponse.json(
        { success: false, error: '交付套件不存在' },
        { status: 404 }
      )
    }

    // Get plan data
    const plan = await queryOne<any>(
      `SELECT * FROM plans WHERE id = ?`,
      [manifest.plan_id]
    )

    // Get components ordered by name
    const components = await query<any>(
      `SELECT * FROM manifest_components WHERE manifest_id = ? ORDER BY component_name ASC`,
      [manifest.id]
    )

    // Build response with relations
    const manifestWithRelations = {
      ...manifest,
      plan,
      components,
    }

    return NextResponse.json({ success: true, data: manifestWithRelations })
  } catch (error) {
    console.error('Error fetching manifest:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch manifest' },
      { status: 500 }
    )
  }
}

// POST /api/manifests/[planId] - Create manifest for a plan
export async function POST(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params
    const body = await request.json()
    const {
      frontendVersion,
      frontendChangeType,
      frontendChangeReason,
      components,
    } = body

    // Check if plan exists
    const plan = await queryOne<any>(
      `SELECT * FROM plans WHERE id = ?`,
      [planId]
    )

    if (!plan) {
      return NextResponse.json(
        { success: false, error: '版本计划不存在' },
        { status: 404 }
      )
    }

    // Check if manifest already exists
    const existing = await queryOne<any>(
      `SELECT * FROM manifests WHERE plan_id = ?`,
      [planId]
    )

    if (existing) {
      return NextResponse.json(
        { success: false, error: '该版本计划已有交付套件' },
        { status: 400 }
      )
    }

    // Create manifest
    const manifestId = await insert(
      `INSERT INTO manifests (
        id, plan_id, frontend_version, frontend_change_type, frontend_change_reason,
        fe_be_check_status, fe_be_check_message,
        dependency_check_status, dependency_check_message,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        generateId(),
        planId,
        frontendVersion,
        frontendChangeType || 'unchanged',
        frontendChangeReason || '',
        'ok',
        '',
        'ok',
        '',
      ]
    )

    // Create components
    for (const c of components) {
      await insert(
        `INSERT INTO manifest_components (
          id, manifest_id, component_name, target_version, change_type, change_reason,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
        [
          generateId(),
          manifestId,
          c.componentName,
          c.targetVersion,
          c.changeType || 'unchanged',
          c.changeReason || '',
        ]
      )
    }

    // Get created manifest with components
    const createdManifest = await queryOne<any>(
      `SELECT * FROM manifests WHERE id = ?`,
      [manifestId]
    )

    const createdComponents = await query<any>(
      `SELECT * FROM manifest_components WHERE manifest_id = ? ORDER BY component_name ASC`,
      [manifestId]
    )

    const manifestWithComponents = {
      ...createdManifest,
      components: createdComponents,
    }

    // Create audit log
    await insert(
      `INSERT INTO audit_logs (
        id, entity_type, entity_id, action, new_value, operator, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, NOW())`,
      [
        generateId(),
        'manifest',
        manifestId,
        'create',
        JSON.stringify({ planId, frontendVersion }),
        'system',
      ]
    )

    return NextResponse.json({ success: true, data: manifestWithComponents })
  } catch (error) {
    console.error('Error creating manifest:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create manifest' },
      { status: 500 }
    )
  }
}

// PUT /api/manifests/[planId] - Update manifest
export async function PUT(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params
    const body = await request.json()
    const {
      frontendVersion,
      frontendChangeType,
      frontendChangeReason,
      feBeCheckStatus,
      feBeCheckMessage,
      dependencyCheckStatus,
      dependencyCheckMessage,
      components,
    } = body

    // Get existing manifest
    const existing = await queryOne<any>(
      `SELECT * FROM manifests WHERE plan_id = ?`,
      [planId]
    )

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '交付套件不存在' },
        { status: 404 }
      )
    }

    // Get existing components for audit log
    const existingComponents = await query<any>(
      `SELECT * FROM manifest_components WHERE manifest_id = ? ORDER BY component_name ASC`,
      [existing.id]
    )

    const existingForAudit = {
      ...existing,
      components: existingComponents,
    }

    // Update manifest
    await update(
      `UPDATE manifests SET
        frontend_version = ?,
        frontend_change_type = ?,
        frontend_change_reason = ?,
        fe_be_check_status = ?,
        fe_be_check_message = ?,
        dependency_check_status = ?,
        dependency_check_message = ?,
        updated_at = NOW()
      WHERE plan_id = ?`,
      [
        frontendVersion,
        frontendChangeType,
        frontendChangeReason,
        feBeCheckStatus,
        feBeCheckMessage,
        dependencyCheckStatus,
        dependencyCheckMessage,
        planId,
      ]
    )

    // Update components if provided
    if (components && Array.isArray(components)) {
      // Delete existing components
      await remove(
        `DELETE FROM manifest_components WHERE manifest_id = ?`,
        [existing.id]
      )

      // Create new components
      for (const c of components) {
        await insert(
          `INSERT INTO manifest_components (
            id, manifest_id, component_name, target_version, change_type, change_reason,
            created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW())`,
          [
            generateId(),
            existing.id,
            c.componentName,
            c.targetVersion,
            c.changeType || 'unchanged',
            c.changeReason || '',
          ]
        )
      }
    }

    // Get updated manifest with components
    const updatedManifest = await queryOne<any>(
      `SELECT * FROM manifests WHERE plan_id = ?`,
      [planId]
    )

    const updatedComponents = await query<any>(
      `SELECT * FROM manifest_components WHERE manifest_id = ? ORDER BY component_name ASC`,
      [updatedManifest.id]
    )

    const updatedWithComponents = {
      ...updatedManifest,
      components: updatedComponents,
    }

    // Create audit log
    await insert(
      `INSERT INTO audit_logs (
        id, entity_type, entity_id, action, old_value, new_value, operator, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        generateId(),
        'manifest',
        existing.id,
        'update',
        JSON.stringify(existingForAudit),
        JSON.stringify(updatedWithComponents),
        'system',
      ]
    )

    return NextResponse.json({ success: true, data: updatedWithComponents })
  } catch (error) {
    console.error('Error updating manifest:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update manifest' },
      { status: 500 }
    )
  }
}

// Helper function to generate CUID-like IDs
function generateId(): string {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 9)
  return `${timestamp}${random}`
}
