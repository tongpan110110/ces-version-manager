/**
 * 发布计划管理 API
 * 支持 MySQL 和 localStorage 双模式
 */

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, insert, update, remove } from '@/lib/db'

// GET 获取所有计划
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const versionLine = searchParams.get('versionLine')
    const search = searchParams.get('search')

    let sql = `SELECT id, version, version_line as versionLine, type, status, summary,
                    related_requirements as relatedRequirements, related_bugs as relatedBugs,
                    created_at as createdAt, updated_at as updatedAt
              FROM plans WHERE 1=1`
    const params: any[] = []

    if (status && status !== 'all') {
      sql += ' AND status = ?'
      params.push(status)
    }

    if (versionLine && versionLine !== 'all') {
      sql += ' AND version_line = ?'
      params.push(versionLine)
    }

    if (search) {
      sql += ' AND (version LIKE ? OR summary LIKE ?)'
      params.push(`%${search}%`, `%${search}%`)
    }

    sql += ' ORDER BY created_at DESC'

    const rows = await query<any>(sql, params)

    return NextResponse.json({ success: true, data: rows })
  } catch (error: any) {
    // MySQL 不可用，返回空数组
    console.log('MySQL 未连接，返回空计划列表')
    return NextResponse.json({ success: true, data: [] })
  }
}

// POST 创建计划
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { version, type, summary, relatedRequirements, relatedBugs } = body

    if (!version || !type || !summary) {
      return NextResponse.json(
        { success: false, error: '版本号、类型和摘要不能为空' },
        { status: 400 }
      )
    }

    // 提取版本线
    const versionParts = version.split('.')
    const versionLine = `${versionParts[0]}.${versionParts[1]}`

    const id = await insert(
      `INSERT INTO plans (id, version, version_line, type, status, summary, related_requirements, related_bugs)
       VALUES (?, ?, ?, ?, 'draft', ?, ?, ?)`,
      [Date.now().toString(), version, versionLine, type, summary,
       JSON.stringify(relatedRequirements || []), JSON.stringify(relatedBugs || [])]
    )

    const plan = await queryOne<any>('SELECT * FROM plans WHERE id = ?', [id])

    return NextResponse.json({ success: true, data: plan })
  } catch (error: any) {
    console.error('创建计划失败:', error)
    return NextResponse.json(
      { success: false, error: error.message || '创建计划失败' },
      { status: 500 }
    )
  }
}

// PUT 更新计划
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, version, type, status, summary, relatedRequirements, relatedBugs } = body

    if (!id) {
      return NextResponse.json(
        { success: false, error: '计划 ID 不能为空' },
        { status: 400 }
      )
    }

    await update(
      `UPDATE plans
       SET version = ?, type = ?, status = ?, summary = ?, related_requirements = ?, related_bugs = ?
       WHERE id = ?`,
      [version, type, status, summary,
       JSON.stringify(relatedRequirements || []), JSON.stringify(relatedBugs || []), id]
    )

    const plan = await queryOne<any>('SELECT * FROM plans WHERE id = ?', [id])

    if (!plan) {
      return NextResponse.json(
        { success: false, error: '计划不存在' },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: plan })
  } catch (error: any) {
    console.error('更新计划失败:', error)
    return NextResponse.json(
      { success: false, error: error.message || '更新计划失败' },
      { status: 500 }
    )
  }
}

// DELETE 删除计划
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { success: false, error: '计划 ID 不能为空' },
        { status: 400 }
      )
    }

    await remove('DELETE FROM plans WHERE id = ?', [id])

    return NextResponse.json({ success: true, message: '删除成功' })
  } catch (error: any) {
    console.error('删除计划失败:', error)
    return NextResponse.json(
      { success: false, error: error.message || '删除计划失败' },
      { status: 500 }
    )
  }
}
