import { NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/dashboard - Get dashboard statistics with multi-version line support
export async function GET() {
  try {
    // Get counts by status
    const [
      totalPlans,
      draftPlans,
      testingPlans,
      readyPlans,
      releasedPlans,
      totalRegions,
      activeVersionLinesConfig,
    ] = await Promise.all([
      prisma.plan.count(),
      prisma.plan.count({ where: { status: 'draft' } }),
      prisma.plan.count({ where: { status: 'testing' } }),
      prisma.plan.count({ where: { status: 'ready' } }),
      prisma.plan.count({ where: { status: 'released' } }),
      prisma.region.count(),
      prisma.systemConfig.findUnique({ where: { key: 'active_version_lines' } }),
    ])

    // Parse active version lines
    const activeVersionLines: string[] = activeVersionLinesConfig
      ? JSON.parse(activeVersionLinesConfig.value)
      : []

    // Get version line statistics
    const versionLineStats = []
    let totalAlignedRegions = 0
    let totalRegionsWithVersion = 0

    for (const versionLine of activeVersionLines) {
      // Get baseline for this version line
      const baselineConfig = await prisma.systemConfig.findUnique({
        where: { key: `baseline_${versionLine}` },
      })

      if (!baselineConfig) continue

      const baselineVersion = baselineConfig.value

      // Get baseline plan
      const baselinePlan = await prisma.plan.findUnique({
        where: { version: baselineVersion },
      })

      if (!baselinePlan) continue

      // Get all regions on this version line
      const regionsOnVersionLine = await prisma.regionVersion.findMany({
        where: {
          plan: {
            versionLine: versionLine,
          },
        },
        include: {
          plan: true,
          region: true,
        },
      })

      // Calculate stats
      const regionsCount = regionsOnVersionLine.length
      const atBaseline = regionsOnVersionLine.filter(
        (rv) => rv.planId === baselinePlan.id
      ).length
      // Simplified: only "aligned" and "behind", no "ahead"
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
        coverage: totalRegions > 0
          ? Math.round((regionsCount / totalRegions) * 100)
          : 0,
      })
    }

    // Calculate overall alignment
    const overallAlignmentRate = totalRegions > 0
      ? Math.round((totalAlignedRegions / totalRegions) * 100)
      : 0

    // Get recent plans
    const recentPlans = await prisma.plan.findMany({
      orderBy: { updatedAt: 'desc' },
      take: 5,
      select: {
        id: true,
        version: true,
        versionLine: true,
        type: true,
        status: true,
        summary: true,
        updatedAt: true,
      },
    })

    // Get recent audit logs
    const recentLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      select: {
        id: true,
        entityType: true,
        action: true,
        field: true,
        operator: true,
        createdAt: true,
      },
    })

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
        recentLogs,
      },
    })
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch dashboard data' },
      { status: 500 }
    )
  }
}
