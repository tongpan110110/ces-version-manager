/**
 * 系统配置 API
 * GET /api/config - 获取所有配置
 * POST /api/config - 创建/更新配置
 */

import { NextRequest, NextResponse } from 'next/server'
import { query, queryOne, insert, update } from '@/lib/db'
import { INIT_SYSTEM_CONFIGS } from '@/lib/init-data'

// GET 获取所有配置
export async function GET() {
  try {
    const rows = await query<any>(
      `SELECT config_key as key, config_value as value
       FROM system_configs`
    )

    // 转换为对象格式
    const configs: Record<string, any> = {}
    rows.forEach((row: any) => {
      configs[row.key] = row.value
    })

    return NextResponse.json({ success: true, data: configs })
  } catch (error: any) {
    // MySQL 不可用，返回默认配置
    console.log('MySQL 未连接，返回默认系统配置')
    return NextResponse.json({ success: true, data: INIT_SYSTEM_CONFIGS })
  }
}

// POST 创建/更新配置
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value } = body

    if (!key || value === undefined) {
      return NextResponse.json(
        { success: false, error: '配置键和值不能为空' },
        { status: 400 }
      )
    }

    // 检查配置是否存在
    const existing = await queryOne<any>(
      'SELECT id FROM system_configs WHERE config_key = ?',
      [key]
    )

    if (existing) {
      // 更新
      await update(
        'UPDATE system_configs SET config_value = ? WHERE config_key = ?',
        [String(value), key]
      )
    } else {
      // 插入
      await insert(
        'INSERT INTO system_configs (config_key, config_value) VALUES (?, ?)',
        [key, String(value)]
      )
    }

    return NextResponse.json({ success: true, message: '配置保存成功' })
  } catch (error: any) {
    console.error('保存配置失败:', error)
    return NextResponse.json(
      { success: false, error: error.message || '保存配置失败' },
      { status: 500 }
    )
  }
}
