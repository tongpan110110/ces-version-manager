/**
 * 版本线管理 API
 */

import { NextResponse } from 'next/server'
import { query } from '@/lib/db'

// GET 获取所有版本线
export async function GET() {
  try {
    const rows = await query<any>(
      `SELECT version_line as versionLine, baseline, is_active as isActive
       FROM version_lines
       ORDER BY version_line DESC`
    )

    return NextResponse.json({ success: true, data: rows })
  } catch (error: any) {
    // MySQL 不可用，返回默认版本线
    console.log('MySQL 未连接，返回默认版本线')
    return NextResponse.json({
      success: true,
      data: [
        { versionLine: '25.8', baseline: '25.8.2', isActive: true },
        { versionLine: '25.10', baseline: '25.10.0', isActive: true }
      ]
    })
  }
}
