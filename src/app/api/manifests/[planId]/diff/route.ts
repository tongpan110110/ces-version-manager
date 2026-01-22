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

    // Get both manifests with their plans and components in parallel
    const [manifestARaw, manifestBRaw] = await Promise.all([
      queryOne<any>(
        `SELECT * FROM manifests WHERE plan_id = ?`,
        [planId]
      ),
      queryOne<any>(
        `SELECT * FROM manifests WHERE plan_id = ?`,
        [compareToId]
      ),
    ])

    if (!manifestARaw || !manifestBRaw) {
      return NextResponse.json(
        { success: false, error: '交付套件不存在' },
        { status: 404 }
      )
    }

    // Get plans and components in parallel
    const [planA, planB, componentsA, componentsB] = await Promise.all([
      queryOne<any>(`SELECT * FROM plans WHERE id = ?`, [manifestARaw.plan_id]),
      queryOne<any>(`SELECT * FROM plans WHERE id = ?`, [manifestBRaw.plan_id]),
      query<any>(
        `SELECT * FROM manifest_components WHERE manifest_id = ? ORDER BY component_name ASC`,
        [manifestARaw.id]
      ),
      query<any>(
        `SELECT * FROM manifest_components WHERE manifest_id = ? ORDER BY component_name ASC`,
        [manifestBRaw.id]
      ),
    ])

    // Build full manifest objects with relations
    const manifestA = {
      ...manifestARaw,
      plan: planA,
      components: componentsA,
    }

    const manifestB = {
      ...manifestBRaw,
      plan: planB,
      components: componentsB,
    }

    // Build diff result
    const diff: any[] = []

    // Compare frontend
    if (manifestA.frontendVersion !== manifestB.frontendVersion) {
      diff.push({
        componentName: 'CES-Portal (前端)',
        versionA: manifestA.frontendVersion,
        versionB: manifestB.frontendVersion,
        changeType: 'changed',
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
          reasonB: compB.change_reason,
        })
      } else if (compA && !compB) {
        diff.push({
          componentName: name,
          versionA: compA.target_version,
          versionB: '-',
          changeType: 'removed',
          reasonA: compA.change_reason,
        })
      } else if (compA && compB && compA.target_version !== compB.target_version) {
        diff.push({
          componentName: name,
          versionA: compA.target_version,
          versionB: compB.target_version,
          changeType: 'changed',
          reasonA: compA.change_reason,
          reasonB: compB.change_reason,
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
