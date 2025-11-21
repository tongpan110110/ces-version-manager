import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

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
    const sourceManifest = await prisma.manifest.findUnique({
      where: { planId },
      include: {
        plan: true,
        components: true,
      },
    })

    if (!sourceManifest) {
      return NextResponse.json(
        { success: false, error: '源交付套件不存在' },
        { status: 404 }
      )
    }

    // Check if new version already exists
    const existingPlan = await prisma.plan.findUnique({
      where: { version: newVersion },
    })

    if (existingPlan) {
      return NextResponse.json(
        { success: false, error: '目标版本号已存在' },
        { status: 400 }
      )
    }

    // Create new plan
    const newPlan = await prisma.plan.create({
      data: {
        version: newVersion,
        type: newType,
        status: 'draft',
        summary: newSummary || `从 ${sourceManifest.plan.version} 复制`,
        relatedRequirements: '[]',
        relatedBugs: '[]',
      },
    })

    // Create new manifest with copied components
    const newManifest = await prisma.manifest.create({
      data: {
        planId: newPlan.id,
        frontendVersion: sourceManifest.frontendVersion,
        frontendChangeType: 'unchanged',
        frontendChangeReason: '',
        feBeCheckStatus: 'ok',
        feBeCheckMessage: '',
        dependencyCheckStatus: 'ok',
        dependencyCheckMessage: '',
        components: {
          create: sourceManifest.components.map(c => ({
            componentName: c.componentName,
            targetVersion: c.targetVersion,
            changeType: 'unchanged',
            changeReason: '',
          })),
        },
      },
      include: {
        plan: true,
        components: true,
      },
    })

    // Create audit logs
    await prisma.auditLog.create({
      data: {
        entityType: 'plan',
        entityId: newPlan.id,
        action: 'create',
        newValue: JSON.stringify({ copiedFrom: planId }),
        operator: 'system',
      },
    })

    return NextResponse.json({ success: true, data: newManifest })
  } catch (error) {
    console.error('Error copying manifest:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to copy manifest' },
      { status: 500 }
    )
  }
}
