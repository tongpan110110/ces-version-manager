import { NextRequest, NextResponse } from 'next/server'
import { queryOne, update } from '@/lib/db'

// PATCH /api/regions/[regionId]/version - Update region's current version
export async function PATCH(
  request: NextRequest,
  { params }: { params: { regionId: string } }
) {
  try {
    const { regionId } = params
    const body = await request.json()
    const { backendVersion, frontendVersion, targetVersion, backendReady, frontendReady } = body

    // Check if region exists
    const region = await queryOne(
      `SELECT * FROM regions WHERE id = ?`,
      [regionId]
    )

    if (!region) {
      return NextResponse.json(
        { success: false, error: '局点不存在' },
        { status: 404 }
      )
    }

    // Build update fields
    const updateFields: string[] = []
    const updateValues: any[] = []

    if (backendVersion !== undefined) {
      updateFields.push('backend_version = ?')
      updateValues.push(backendVersion)
    }
    if (frontendVersion !== undefined) {
      updateFields.push('frontend_version = ?')
      updateValues.push(frontendVersion)
    }
    if (targetVersion !== undefined) {
      updateFields.push('target_version = ?')
      updateValues.push(targetVersion)
    }
    if (typeof backendReady === 'boolean') {
      updateFields.push('backend_ready = ?')
      updateValues.push(backendReady ? 1 : 0)
    }
    if (typeof frontendReady === 'boolean') {
      updateFields.push('frontend_ready = ?')
      updateValues.push(frontendReady ? 1 : 0)
    }

    if (updateFields.length > 0) {
      updateFields.push('updated_at = NOW()')
      updateValues.push(regionId)

      await update(
        `UPDATE regions SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      )
    }

    // Fetch updated region
    const updatedRegion = await queryOne(
      `SELECT * FROM regions WHERE id = ?`,
      [regionId]
    )

    // Convert to camelCase
    const responseData = {
      id: updatedRegion.id,
      name: updatedRegion.name,
      area: updatedRegion.area,
      backendVersion: updatedRegion.backend_version,
      frontendVersion: updatedRegion.frontend_version,
      targetVersion: updatedRegion.target_version,
      backendReady: updatedRegion.backend_ready === 1,
      frontendReady: updatedRegion.frontend_ready === 1,
      createdAt: updatedRegion.created_at,
      updatedAt: updatedRegion.updated_at,
    }

    return NextResponse.json({ success: true, data: responseData })
  } catch (error) {
    console.error('Error updating region version:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update region version' },
      { status: 500 }
    )
  }
}
