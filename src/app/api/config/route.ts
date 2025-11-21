import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/db'

// GET /api/config - Get system configuration
export async function GET() {
  try {
    const configs = await prisma.systemConfig.findMany({
      orderBy: { key: 'asc' },
    })

    return NextResponse.json({
      success: true,
      data: { configs }
    })
  } catch (error) {
    console.error('Error fetching config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch config' },
      { status: 500 }
    )
  }
}

// PUT /api/config - Update system configuration
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || !value) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }

    const config = await prisma.systemConfig.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })

    return NextResponse.json({ success: true, data: config })
  } catch (error) {
    console.error('Error updating config:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update config' },
      { status: 500 }
    )
  }
}
