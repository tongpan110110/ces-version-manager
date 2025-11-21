import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

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

    // Get both manifests
    const [manifestA, manifestB] = await Promise.all([
      prisma.manifest.findUnique({
        where: { planId },
        include: {
          plan: true,
          components: {
            orderBy: { componentName: 'asc' },
          },
        },
      }),
      prisma.manifest.findUnique({
        where: { planId: compareToId },
        include: {
          plan: true,
          components: {
            orderBy: { componentName: 'asc' },
          },
        },
      }),
    ])

    if (!manifestA || !manifestB) {
      return NextResponse.json(
        { success: false, error: '交付套件不存在' },
        { status: 404 }
      )
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
    const componentsA = new Map(
      manifestA.components.map(c => [c.componentName, c])
    )
    const componentsB = new Map(
      manifestB.components.map(c => [c.componentName, c])
    )

    // Get all unique component names
    const allComponents = new Set([
      ...componentsA.keys(),
      ...componentsB.keys(),
    ])

    for (const name of allComponents) {
      const compA = componentsA.get(name)
      const compB = componentsB.get(name)

      if (!compA && compB) {
        diff.push({
          componentName: name,
          versionA: '-',
          versionB: compB.targetVersion,
          changeType: 'added',
          reasonB: compB.changeReason,
        })
      } else if (compA && !compB) {
        diff.push({
          componentName: name,
          versionA: compA.targetVersion,
          versionB: '-',
          changeType: 'removed',
          reasonA: compA.changeReason,
        })
      } else if (compA && compB && compA.targetVersion !== compB.targetVersion) {
        diff.push({
          componentName: name,
          versionA: compA.targetVersion,
          versionB: compB.targetVersion,
          changeType: 'changed',
          reasonA: compA.changeReason,
          reasonB: compB.changeReason,
        })
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        planA: {
          id: manifestA.plan.id,
          version: manifestA.plan.version,
        },
        planB: {
          id: manifestB.plan.id,
          version: manifestB.plan.version,
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
