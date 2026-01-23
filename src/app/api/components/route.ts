/**
 * 组件管理 API
 */

import { NextRequest, NextResponse } from 'next/server'
import { query, insert, update, remove } from '@/lib/db'
import { INIT_COMPONENTS } from '@/lib/init-data'

// GET 获取所有组件
export async function GET() {
  try {
    const rows = await query<any>(
      `SELECT id, name, description, type
       FROM components
       ORDER BY type, name`
    )

    return NextResponse.json({ success: true, data: rows })
  } catch (error: any) {
    // MySQL 不可用，从 init-data.ts 加载数据
    console.log('MySQL 未连接，从 init-data.ts 加载组件列表')
    return NextResponse.json({ success: true, data: INIT_COMPONENTS })
  }
}

// POST 创建组件
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, description, type } = body

    if (!name || !type) {
      return NextResponse.json(
        { success: false, error: '组件名称和类型不能为空' },
        { status: 400 }
      )
    }

    await insert(
      'INSERT INTO components (name, description, type) VALUES (?, ?, ?)',
      [name, description || '', type]
    )

    return NextResponse.json({ success: true, message: '组件创建成功' })
  } catch (error: any) {
    console.error('创建组件失败:', error)
    return NextResponse.json(
      { success: false, error: error.message || '创建组件失败' },
      { status: 500 }
    )
  }
}

// DELETE 删除组件
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const name = searchParams.get('name')

    if (!name) {
      return NextResponse.json(
        { success: false, error: '组件名称不能为空' },
        { status: 400 }
      )
    }

    await remove('DELETE FROM components WHERE name = ?', [name])

    return NextResponse.json({ success: true, message: '删除成功' })
  } catch (error: any) {
    console.error('删除组件失败:', error)
    return NextResponse.json(
      { success: false, error: error.message || '删除组件失败' },
      { status: 500 }
    )
  }
}
