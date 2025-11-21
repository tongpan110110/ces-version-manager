import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/regions - Get all regions with current versions and version line info
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const area = searchParams.get('area')

    const where: any = {}
    if (area) {
      where.area = area
    }

    const regions = await prisma.region.findMany({
      where,
      include: {
        currentVersion: {
          include: {
            plan: {
              select: {
                id: true,
                version: true,
                versionLine: true,
                status: true,
              },
            },
          },
        },
      },
      orderBy: [
        { area: 'asc' },
        { name: 'asc' },
      ],
    })

    // Get active version lines and their baselines
    const activeVersionLinesConfig = await prisma.systemConfig.findUnique({
      where: { key: 'active_version_lines' },
    })

    const activeVersionLines: string[] = activeVersionLinesConfig
      ? JSON.parse(activeVersionLinesConfig.value)
      : []

    // Get baselines for each version line
    const baselines: Record<string, string> = {}
    for (const versionLine of activeVersionLines) {
      const baselineConfig = await prisma.systemConfig.findUnique({
        where: { key: `baseline_${versionLine}` },
      })
      if (baselineConfig) {
        baselines[versionLine] = baselineConfig.value
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        regions,
        baselines,
        versionLines: activeVersionLines,
      },
    })
  } catch (error) {
    console.error('Error fetching regions:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch regions' },
      { status: 500 }
    )
  }
}
