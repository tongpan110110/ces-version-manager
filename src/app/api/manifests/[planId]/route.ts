import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/manifests/[planId] - Get manifest for a plan
export async function GET(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params

    const manifest = await prisma.manifest.findUnique({
      where: { planId },
      include: {
        plan: true,
        components: {
          orderBy: { componentName: 'asc' },
        },
      },
    })

    if (!manifest) {
      return NextResponse.json(
        { success: false, error: '交付套件不存在' },
        { status: 404 }
      )
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

// POST /api/manifests/[planId] - Create manifest for a plan
export async function POST(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params
    const body = await request.json()
    const {
      frontendVersion,
      frontendChangeType,
      frontendChangeReason,
      components,
    } = body

    // Check if plan exists
    const plan = await prisma.plan.findUnique({
      where: { id: planId },
    })

    if (!plan) {
      return NextResponse.json(
        { success: false, error: '版本计划不存在' },
        { status: 404 }
      )
    }

    // Check if manifest already exists
    const existing = await prisma.manifest.findUnique({
      where: { planId },
    })

    if (existing) {
      return NextResponse.json(
        { success: false, error: '该版本计划已有交付套件' },
        { status: 400 }
      )
    }

    const manifest = await prisma.manifest.create({
      data: {
        planId,
        frontendVersion,
        frontendChangeType: frontendChangeType || 'unchanged',
        frontendChangeReason: frontendChangeReason || '',
        components: {
          create: components.map((c: any) => ({
            componentName: c.componentName,
            targetVersion: c.targetVersion,
            changeType: c.changeType || 'unchanged',
            changeReason: c.changeReason || '',
          })),
        },
      },
      include: {
        components: true,
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'manifest',
        entityId: manifest.id,
        action: 'create',
        newValue: JSON.stringify({ planId, frontendVersion }),
        operator: 'system',
      },
    })

    return NextResponse.json({ success: true, data: manifest })
  } catch (error) {
    console.error('Error creating manifest:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create manifest' },
      { status: 500 }
    )
  }
}

// PUT /api/manifests/[planId] - Update manifest
export async function PUT(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params
    const body = await request.json()
    const {
      frontendVersion,
      frontendChangeType,
      frontendChangeReason,
      feBeCheckStatus,
      feBeCheckMessage,
      dependencyCheckStatus,
      dependencyCheckMessage,
      components,
    } = body

    const existing = await prisma.manifest.findUnique({
      where: { planId },
      include: { components: true },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: '交付套件不存在' },
        { status: 404 }
      )
    }

    // Update manifest
    const manifest = await prisma.manifest.update({
      where: { planId },
      data: {
        frontendVersion,
        frontendChangeType,
        frontendChangeReason,
        feBeCheckStatus,
        feBeCheckMessage,
        dependencyCheckStatus,
        dependencyCheckMessage,
      },
    })

    // Update components if provided
    if (components && Array.isArray(components)) {
      // Delete existing components
      await prisma.manifestComponent.deleteMany({
        where: { manifestId: existing.id },
      })

      // Create new components
      await prisma.manifestComponent.createMany({
        data: components.map((c: any) => ({
          manifestId: existing.id,
          componentName: c.componentName,
          targetVersion: c.targetVersion,
          changeType: c.changeType || 'unchanged',
          changeReason: c.changeReason || '',
        })),
      })
    }

    // Get updated manifest with components
    const updatedManifest = await prisma.manifest.findUnique({
      where: { planId },
      include: {
        components: {
          orderBy: { componentName: 'asc' },
        },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'manifest',
        entityId: manifest.id,
        action: 'update',
        oldValue: JSON.stringify(existing),
        newValue: JSON.stringify(updatedManifest),
        operator: 'system',
      },
    })

    return NextResponse.json({ success: true, data: updatedManifest })
  } catch (error) {
    console.error('Error updating manifest:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update manifest' },
      { status: 500 }
    )
  }
}
