import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'

// GET /api/manifests/[planId]/diff?compareTo=xxx - Compare two manifests
export async function GET(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params
    const searchParams = request.nextUrl.searchParams
    const compareToId = searchParams.get('compareTo')

    if (!compareToId) {
      return NextResponse.json(
        { success: false, error: '请指定要对比的版本' },
        { status: 400 }
      )
    }

    // Get both plans and their components in parallel
    const [planA, planB, componentsA, componentsB] = await Promise.all([
      queryOne<any>(`SELECT * FROM plans WHERE id = ?`, [planId]),
      queryOne<any>(`SELECT * FROM plans WHERE id = ?`, [compareToId]),
      query<any>(
        `SELECT * FROM plan_components WHERE plan_id = ? ORDER BY component_name ASC`,
        [planId]
      ),
      query<any>(
        `SELECT * FROM plan_components WHERE plan_id = ? ORDER BY component_name ASC`,
        [compareToId]
      ),
    ])

    if (!planA || !planB) {
      return NextResponse.json(
        { success: false, error: '版本计划不存在' },
        { status: 404 }
      )
    }

    // Build diff result
    const diff: any[] = []

    // Compare frontend (从组件中找前端组件)
    const frontendA = componentsA.find(c => c.component_type === 'frontend')
    const frontendB = componentsB.find(c => c.component_type === 'frontend')

    if (frontendA && frontendB && frontendA.target_version !== frontendB.target_version) {
      diff.push({
        componentName: `${frontendA.component_name} (前端)`,
        versionA: frontendA.target_version,
        versionB: frontendB.target_version,
        changeType: 'changed',
      })
    } else if (frontendA && !frontendB) {
      diff.push({
        componentName: `${frontendA.component_name} (前端)`,
        versionA: frontendA.target_version,
        versionB: '-',
        changeType: 'removed',
      })
    } else if (!frontendA && frontendB) {
      diff.push({
        componentName: `${frontendB.component_name} (前端)`,
        versionA: '-',
        versionB: frontendB.target_version,
        changeType: 'added',
      })
    }

    // Build component map for comparison
    const componentsAMap = new Map(
      componentsA.map(c => [c.component_name, c])
    )
    const componentsBMap = new Map(
      componentsB.map(c => [c.component_name, c])
    )

    // Get all unique component names
    const allComponents = new Set([
      ...Array.from(componentsAMap.keys()),
      ...Array.from(componentsBMap.keys()),
    ])

    for (const name of Array.from(allComponents)) {
      const compA = componentsAMap.get(name)
      const compB = componentsBMap.get(name)

      if (!compA && compB) {
        diff.push({
          componentName: name,
          versionA: '-',
          versionB: compB.target_version,
          changeType: 'added',
        })
      } else if (compA && !compB) {
        diff.push({
          componentName: name,
          versionA: compA.target_version,
          versionB: '-',
          changeType: 'removed',
        })
      } else if (compA && compB && compA.target_version !== compB.target_version) {
        diff.push({
          componentName: name,
          versionA: compA.target_version,
          versionB: compB.target_version,
          changeType: 'changed',
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        planA: {
          id: planA.id,
          version: planA.version,
        },
        planB: {
          id: planB.id,
          version: planB.version,
        },
        diff,
        totalChanges: diff.length,
      },
    })
  } catch (error) {
    console.error('Error comparing manifests:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to compare manifests' },
      { status: 500 }
    )
  }
}
