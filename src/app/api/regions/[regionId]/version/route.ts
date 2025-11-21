import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// PATCH /api/regions/[regionId]/version - Update region's current version
export async function PATCH(
  request: NextRequest,
  { params }: { params: { regionId: string } }
) {
  try {
    const { regionId } = params
    const body = await request.json()
    const { planId, backendReady, frontendReady } = body

    // Check if region exists
    const region = await prisma.region.findUnique({
      where: { id: regionId },
      include: { currentVersion: true },
    })

    if (!region) {
      return NextResponse.json(
        { success: false, error: '局点不存在' },
        { status: 404 }
      )
    }

    // Check if plan exists
    if (planId) {
      const plan = await prisma.plan.findUnique({
        where: { id: planId },
      })

      if (!plan) {
        return NextResponse.json(
          { success: false, error: '版本计划不存在' },
          { status: 404 }
        )
      }
    }

    // Update or create region version
    let regionVersion
    const oldVersion = region.currentVersion

    if (region.currentVersion) {
      regionVersion = await prisma.regionVersion.update({
        where: { regionId },
        data: {
          ...(planId && { planId }),
          ...(typeof backendReady === 'boolean' && { backendReady }),
          ...(typeof frontendReady === 'boolean' && { frontendReady }),
          lastUpdatedAt: new Date(),
        },
        include: {
          plan: true,
        },
      })
    } else if (planId) {
      regionVersion = await prisma.regionVersion.create({
        data: {
          regionId,
          planId,
          backendReady: backendReady ?? false,
          frontendReady: frontendReady ?? false,
        },
        include: {
          plan: true,
        },
      })
    }

    // Create audit log
    await prisma.auditLog.create({
      data: {
        entityType: 'region',
        entityId: regionId,
        action: 'update',
        field: 'version',
        oldValue: oldVersion?.planId || null,
        newValue: regionVersion?.planId || null,
        operator: 'system',
      },
    })

    return NextResponse.json({ success: true, data: regionVersion })
  } catch (error) {
    console.error('Error updating region version:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update region version' },
      { status: 500 }
    )
  }
}
