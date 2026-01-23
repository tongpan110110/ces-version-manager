import { NextRequest, NextResponse } from 'next/server'
import { queryOne } from '@/lib/db'

// GET /api/regions/[regionId] - Get region details
export async function GET(
  request: NextRequest,
  { params }: { params: { regionId: string } }
) {
  try {
    const { regionId } = params

    const region = await queryOne(
      `SELECT * FROM regions WHERE id = ?`,
      [regionId]
    )

    if (!region) {
      return NextResponse.json(
        { success: false, error: '局点不存在' },
        { status: 404 }
      )
    }

    // 转换为驼峰命名
    const responseData = {
      id: region.id,
      name: region.name,
      area: region.area,
      backendVersion: region.backend_version,
      frontendVersion: region.frontend_version,
      targetVersion: region.target_version,
      backendReady: region.backend_ready === 1,
      frontendReady: region.frontend_ready === 1,
      createdAt: region.created_at,
      updatedAt: region.updated_at,
    }

    return NextResponse.json({ success: true, data: responseData })
  } catch (error) {
    console.error('Error fetching region:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch region' },
      { status: 500 }
    )
  }
}
