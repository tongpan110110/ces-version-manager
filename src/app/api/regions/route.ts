/**
 * 局点管理 API
 * 支持 MySQL 和 localStorage 双模式
 */

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, insert, update, remove } from '@/lib/db'

// 从 localStorage 读取数据（MySQL 不可用时的备用方案）
function getLocalStorageData(key: string): any {
  if (typeof window === 'undefined') return null
  try {
    const data = localStorage.getItem(key)
    return data ? JSON.parse(data) : null
  } catch {
    return null
  }
}

// 局点接口
export interface Region {
  id?: number
  name: string
  area: string
  backendVersion: string
  frontendVersion: string
  targetVersion: string
  backendReady: boolean
  frontendReady: boolean
}

// GET 获取所有局点
export async function GET() {
  try {
    const rows = await query<any>(
      `SELECT id, name, area, backend_version as backendVersion,
              frontend_version as frontendVersion, target_version as targetVersion,
              backend_ready as backendReady, frontend_ready as frontendReady
       FROM regions ORDER BY name`
    )

    return NextResponse.json({ success: true, data: rows })
  } catch (error: any) {
    // MySQL 不可用，尝试从 localStorage 读取（仅在开发环境）
    if (process.env.NODE_ENV === 'development') {
      try {
        const { generateInitRegions } = require('@/lib/init-data')
        const mockRegions = generateInitRegions()
        return NextResponse.json({ success: true, data: mockRegions })
      } catch (e) {
        // 如果连初始化数据都没有，返回空数组
        return NextResponse.json({ success: true, data: [] })
      }
    }

    console.error('获取局点失败:', error)
    return NextResponse.json(
      { success: false, error: error.message || '获取局点失败' },
      { status: 500 }
    )
  }
}

// POST 创建局点
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, area, backendVersion, frontendVersion, targetVersion, backendReady, frontendReady } = body

    if (!name || !area) {
      return NextResponse.json(
        { success: false, error: '局点名称和区域不能为空' },
        { status: 400 }
      )
    }

    const id = await insert(
      `INSERT INTO regions (name, area, backend_version, frontend_version, target_version, backend_ready, frontend_ready)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [name, area, backendVersion || '', frontendVersion || '', targetVersion || '', backendReady || false, frontendReady || false]
    )

    const region = await queryOne<any>(
      'SELECT * FROM regions WHERE id = ?',
      [id]
    )

    return NextResponse.json({ success: true, data: region })
  } catch (error: any) {
    console.error('创建局点失败:', error)
    return NextResponse.json(
      { success: false, error: error.message || '创建局点失败' },
      { status: 500 }
    )
  }
}

// PUT 更新局点
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, name, area, backendVersion, frontendVersion, targetVersion, backendReady, frontendReady } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: '局点 ID 不能为空' },
        { status: 400 }
      )
    }

    await update(
      `UPDATE regions
       SET name = ?, area = ?, backend_version = ?, frontend_version = ?,
           target_version = ?, backend_ready = ?, frontend_ready = ?
       WHERE id = ?`,
      [name, area, backendVersion || '', frontendVersion || '', targetVersion || '', backendReady || false, frontendReady || false, id]
    )

    const region = await queryOne<any>('SELECT * FROM regions WHERE id = ?', [id])

    if (!region) {
      return NextResponse.json(
        { success: false, error: '局点不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: region })
  } catch (error: any) {
    console.error('更新局点失败:', error)
    return NextResponse.json(
      { success: false, error: error.message || '更新局点失败' },
      { status: 500 }
    )
  }
}

// DELETE 删除局点
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: '局点 ID 不能为空' },
        { status: 400 }
      )
    }

    await remove('DELETE FROM regions WHERE id = ?', [id])

    return NextResponse.json({ success: true, message: '删除成功' })
  } catch (error: any) {
    console.error('删除局点失败:', error)
    return NextResponse.json(
      { success: false, error: error.message || '删除局点失败' },
      { status: 500 }
    )
  }
}
