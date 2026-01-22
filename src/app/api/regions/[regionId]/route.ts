import { NextRequest, NextResponse } from 'next/server'
import { queryOne, query } from '@/lib/db'

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

// GET /api/regions/[regionId] - Get region details
export async function GET(
  request: NextRequest,
  { params }: { params: { regionId: string } }
) {
  try {
    const { regionId } = params

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

    // If there's a plan, fetch its manifest with components
    let manifest: any = null
    let components: any[] = []

    if (region.planId) {
      manifest = await queryOne(
        'SELECT * FROM manifests WHERE plan_id = ?',
        [region.planId]
      )

      if (manifest) {
        components = await query(
          'SELECT * FROM manifest_components WHERE manifest_id = ? ORDER BY component_name ASC',
          [manifest.id]
        )
      }
    }

    // Build response structure
    const responseData = {
      ...toCamelCase(region),
      currentVersion: region.currentVersionId ? {
        id: region.currentVersionId,
        planId: region.currentPlanId,
        backendReady: region.currentBackendReady,
        frontendReady: region.currentFrontendReady,
        updatedAt: region.currentUpdatedAt,
        plan: region.planId ? {
          id: region.planId,
          version: region.planVersion,
          versionLine: region.planVersionLine,
          type: region.planType,
          status: region.planStatus,
          summary: region.planSummary,
          manifest: manifest ? {
            ...toCamelCase(manifest),
            components: components.map(toCamelCase)
          } : null
        } : null
      } : null
    }

    return NextResponse.json({ success: true, data: responseData })
  } catch (error) {
    console.error('Error fetching region:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch region' },
      { status: 500 }
    )
  }
}
