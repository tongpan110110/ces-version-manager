import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

// GET /api/manifests/[planId] - Get manifest for a plan
export async function GET(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params

    // Get plan data
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

    // Get components from plan_components table
    const components = await query<any>(
      `SELECT * FROM plan_components WHERE plan_id = ? ORDER BY component_name ASC`,
      [planId]
    )

    // Get timelines
    const timelines = await query<any>(
      `SELECT * FROM plan_timelines WHERE plan_id = ?`,
      [planId]
    )

    // Get upgrade window
    const upgradeWindow = await queryOne<any>(
      `SELECT * FROM upgrade_windows WHERE plan_id = ?`,
      [planId]
    )

    // Build manifest response
    const manifest = {
      planId: plan.id,
      plan,
      components: components.map((c: any) => ({
        componentName: c.component_name,
        componentType: c.component_type,
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
    }

    return NextResponse.json({ success: true, data: manifest })
  } catch (error) {
    console.error('Error fetching manifest:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch manifest' },
      { status: 500 }
    )
  }
}
