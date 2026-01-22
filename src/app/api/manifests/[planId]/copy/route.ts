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

    // Get source manifest
    const sourceManifest = await queryOne<any>(
      `SELECT m.*, p.* FROM manifests m
       JOIN plans p ON m.plan_id = p.id
       WHERE m.plan_id = ?`,
      [planId]
    )

    if (!sourceManifest) {
      return NextResponse.json(
        { success: false, error: '源交付套件不存在' },
        { status: 404 }
      )
    }

    // Get source components
    const sourceComponents = await query<any>(
      `SELECT * FROM manifest_components WHERE manifest_id = ?`,
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
    const newPlanId = await insert(
      `INSERT INTO plans (id, version, version_line, type, status, summary, related_requirements, related_bugs)
       VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)`,
      [
        Date.now().toString(),
        newVersion,
        versionLine,
        newType,
        newSummary || `从 ${sourceManifest.version} 复制`,
        '[]',
        '[]',
      ]
    )

    // Create new manifest
    await insert(
      `INSERT INTO manifests (plan_id, frontend_version, frontend_change_type, frontend_change_reason,
         fe_be_check_status, fe_be_check_message, dependency_check_status, dependency_check_message)
       VALUES (?, ?, '', '', 'ok', '', 'ok', '')`,
      [newPlanId, sourceManifest.frontendVersion]
    )

    // Copy components
    for (const comp of sourceComponents) {
      await insert(
        `INSERT INTO manifest_components (manifest_id, component_name, target_version, change_type, change_reason)
         VALUES (?, ?, ?, 'unchanged', '')`,
        [newPlanId, comp.component_name, comp.target_version]
      )
    }

    // Get the complete new manifest
    const newManifest = await queryOne<any>(
      `SELECT m.*, p.* FROM manifests m
       JOIN plans p ON m.plan_id = p.id
       WHERE m.plan_id = ?`,
      [newPlanId]
    )

    return NextResponse.json({ success: true, data: newManifest })
  } catch (error: any) {
    console.error('Error copying manifest:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to copy manifest' },
      { status: 500 }
    )
  }
}
