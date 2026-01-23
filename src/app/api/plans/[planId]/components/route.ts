import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, insert, update, remove } from '@/lib/db'

// GET /api/plans/[planId]/components - 获取计划的组件列表
export async function GET(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params

    const components = await query(
      'SELECT * FROM plan_components WHERE plan_id = ? ORDER BY component_name ASC',
      [planId]
    )

    const result = components.map((c: any) => ({
      name: c.component_name,
      type: c.component_type,
      currentVersion: c.current_version,
      targetVersion: c.target_version,
      enabled: c.enabled === 1,
    }))

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('获取计划组件失败:', error)
    return NextResponse.json(
      { success: false, error: error.message || '获取计划组件失败' },
      { status: 500 }
    )
  }
}

// PUT /api/plans/[planId]/components - 更新计划的组件列表
export async function PUT(
  request: NextRequest,
  { params }: { params: { planId: string } }
) {
  try {
    const { planId } = params
    const body = await request.json()
    const { components } = body

    if (!Array.isArray(components)) {
      return NextResponse.json(
        { success: false, error: '组件列表格式错误' },
        { status: 400 }
      )
    }

    // 检查计划是否存在
    const plan = await queryOne('SELECT * FROM plans WHERE id = ?', [planId])
    if (!plan) {
      return NextResponse.json(
        { success: false, error: '发布计划不存在' },
        { status: 404 }
      )
    }

    // 删除旧的组件配置
    await remove('DELETE FROM plan_components WHERE plan_id = ?', [planId])

    // 插入新的组件配置
    for (const comp of components) {
      await insert(
        `INSERT INTO plan_components (plan_id, component_name, component_type, current_version, target_version, enabled)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          planId,
          comp.name,
          comp.type,
          comp.currentVersion || '',
          comp.targetVersion || '',
          comp.enabled ? 1 : 0,
        ]
      )
    }

    // 返回更新后的组件列表
    const updatedComponents = await query(
      'SELECT * FROM plan_components WHERE plan_id = ? ORDER BY component_name ASC',
      [planId]
    )

    const result = updatedComponents.map((c: any) => ({
      name: c.component_name,
      type: c.component_type,
      currentVersion: c.current_version,
      targetVersion: c.target_version,
      enabled: c.enabled === 1,
    }))

    return NextResponse.json({ success: true, data: result })
  } catch (error: any) {
    console.error('更新计划组件失败:', error)
    return NextResponse.json(
      { success: false, error: error.message || '更新计划组件失败' },
      { status: 500 }
    )
  }
}
