import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/regions/[regionId] - Get region details
export async function GET(
  request: NextRequest,
  { params }: { params: { regionId: string } }
) {
  try {
    const { regionId } = params

    const region = await prisma.region.findUnique({
      where: { id: regionId },
      include: {
        currentVersion: {
          include: {
            plan: {
              include: {
                manifest: {
                  include: {
                    components: {
                      orderBy: { componentName: 'asc' },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    if (!region) {
      return NextResponse.json(
        { success: false, error: '局点不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: region })
  } catch (error) {
    console.error('Error fetching region:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch region' },
      { status: 500 }
    )
  }
}
