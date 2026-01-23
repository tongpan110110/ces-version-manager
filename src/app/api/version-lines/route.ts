/**
 * 版本线管理 API
 */

import { NextResponse } from 'next/server'
import { query } from '@/lib/db'
import { INIT_CONFIGS } from '@/lib/init-data'

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
    // MySQL 不可用，从 init-data.ts 的 CONFIGS 推导版本线
    console.log('MySQL 未连接，从 init-data.ts 加载版本线')
    const activeVersionLines: string[] = JSON.parse(INIT_CONFIGS.active_version_lines || '["25.8","25.10"]')

    const versionLines = activeVersionLines.map(versionLine => ({
      versionLine,
      baseline: (INIT_CONFIGS as Record<string, string>)[`baseline_${versionLine}`] || '',
      isActive: true,
    }))

    return NextResponse.json({
      success: true,
      data: versionLines,
    })
  }
}
