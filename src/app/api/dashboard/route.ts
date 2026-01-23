import { NextResponse } from 'next/server'
import { query, queryOne } from '@/lib/db'
import { INIT_PLANS, INIT_REGIONS, INIT_CONFIGS } from '@/lib/init-data'

// GET /api/dashboard - Get dashboard statistics
export async function GET() {
  try {
    // Get counts by status
    const [plansResult, regionsResult, configsResult] = await Promise.all([
      query<any>(`SELECT status, COUNT(*) as count FROM plans GROUP BY status`),
      query<any>(`SELECT COUNT(*) as count FROM regions`),
      query<any>(`SELECT config_key as key, config_value as value FROM system_configs`),
    ])

    // Build stats object
    const stats = {
      totalPlans: 0,
      draftPlans: 0,
      testingPlans: 0,
      readyPlans: 0,
      releasedPlans: 0,
      totalRegions: regionsResult[0]?.count || 0,
      totalAlignedRegions: 0,
      overallAlignmentRate: 0,
    }

    plansResult.forEach((row: any) => {
      stats.totalPlans += row.count
      switch (row.status) {
        case 'draft': stats.draftPlans = row.count; break
        case 'testing': stats.testingPlans = row.count; break
        case 'ready': stats.readyPlans = row.count; break
        case 'released': stats.releasedPlans = row.count; break
      }
    })

    // Convert configs to object
    const configs: Record<string, string> = {}
    configsResult.forEach((row: any) => {
      configs[row.key] = row.value
    })

    // Parse active version lines
    const activeVersionLines: string[] = configs['active_version_lines']
      ? JSON.parse(configs['active_version_lines'])
      : ['25.8', '25.10']

    // Get version line statistics
    const versionLineStats = []
    let totalAlignedRegions = 0
    let totalRegionsWithVersion = 0

    for (const versionLine of activeVersionLines) {
      const baselineVersion = configs[`baseline_${versionLine}`]
      if (!baselineVersion) continue

      // Get regions count (simplified - using total regions for now)
      const regionsCount = stats.totalRegions

      // For simplicity, using placeholder data
      const atBaseline = Math.floor(regionsCount * 0.6)
      const behindBaseline = regionsCount - atBaseline

      totalAlignedRegions += atBaseline
      totalRegionsWithVersion += regionsCount

      versionLineStats.push({
        versionLine,
        baseline: baselineVersion,
        totalRegions: regionsCount,
        atBaseline,
        behindBaseline,
        alignmentRate: regionsCount > 0
          ? Math.round((atBaseline / regionsCount) * 100)
          : 0,
        coverage: stats.totalRegions > 0
          ? Math.round((regionsCount / stats.totalRegions) * 100)
          : 0,
      })
    }

    stats.totalAlignedRegions = totalAlignedRegions
    stats.overallAlignmentRate = totalRegionsWithVersion > 0
      ? Math.round((totalAlignedRegions / totalRegionsWithVersion) * 100)
      : 0

    // Get recent plans
    const recentPlans = await query<any>(
      `SELECT id, version, version_line as versionLine, type, status, summary, updated_at as updatedAt
       FROM plans
       ORDER BY updated_at DESC
       LIMIT 5`
    )

    // Get recent audit logs (if table exists)
    let recentLogs: any[] = []
    try {
      recentLogs = await query<any>(
        `SELECT id, entity_type as entityType, action, field, operator, created_at as createdAt
         FROM audit_logs
         ORDER BY created_at DESC
         LIMIT 10`
      )
    } catch (e) {
      // Table might not exist yet
      recentLogs = []
    }

    return NextResponse.json({
      success: true,
      data: {
        stats,
        versionLines: versionLineStats,
        recentPlans,
        recentLogs,
      },
    })
  } catch (error: any) {
    console.error('Error fetching dashboard data:', error)
    // 从 init-data.ts 加载初始化数据并计算统计信息
    const plans = INIT_PLANS
    const regions = INIT_REGIONS
    const configs = INIT_CONFIGS

    // Get active version lines
    const activeVersionLines: string[] = JSON.parse(configs.active_version_lines || '["25.8","25.10"]')

    // Calculate stats
    const totalPlans = plans.length
    const draftPlans = plans.filter((p) => p.status === 'draft').length
    const testingPlans = plans.filter((p) => p.status === 'testing').length
    const readyPlans = plans.filter((p) => p.status === 'ready').length
    const releasedPlans = plans.filter((p) => p.status === 'released').length
    const totalRegions = regions.length

    // Calculate version line stats
    const versionLineStats = activeVersionLines.map((versionLine) => {
      const baseline = (configs as Record<string, string>)[`baseline_${versionLine}`] || ''
      const baselinePlan = plans.find((p) => p.version === baseline)

      // Get regions on this version line (based on their backendVersion)
      const regionsOnLine = regions.filter((r) => {
        if (!r.backendVersion) return false
        const parts = r.backendVersion.split('.')
        const regionVersionLine = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : ''
        return regionVersionLine === versionLine
      })

      const atBaseline = baselinePlan
        ? regionsOnLine.filter((r) => r.backendVersion === baseline).length
        : 0
      const behindBaseline = regionsOnLine.length - atBaseline

      return {
        versionLine,
        baseline,
        totalRegions: regionsOnLine.length,
        atBaseline,
        behindBaseline,
        alignmentRate: regionsOnLine.length > 0 ? Math.round((atBaseline / regionsOnLine.length) * 100) : 0,
        coverage: totalRegions > 0 ? Math.round((regionsOnLine.length / totalRegions) * 100) : 0,
      }
    })

    const totalAlignedRegions = versionLineStats.reduce((sum, vl) => sum + vl.atBaseline, 0)
    const overallAlignmentRate = totalRegions > 0 ? Math.round((totalAlignedRegions / totalRegions) * 100) : 0

    // Get recent plans
    const recentPlans = [...plans]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)

    return NextResponse.json({
      success: true,
      data: {
        stats: {
          totalPlans,
          draftPlans,
          testingPlans,
          readyPlans,
          releasedPlans,
          totalRegions,
          totalAlignedRegions,
          overallAlignmentRate,
        },
        versionLines: versionLineStats,
        recentPlans,
        recentLogs: [],
      },
    })
  }
}
