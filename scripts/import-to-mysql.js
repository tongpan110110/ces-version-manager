/**
 * 导入 localStorage 备份数据到 MySQL
 * 运行方式：node scripts/import-to-mysql.js
 */

const mysql = require('mysql2/promise')
const fs = require('fs')
const path = require('path')

// 读取备份数据
const backupPath = path.join(__dirname, '../src/lib/local-storage-backup.json')
const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'))
const data = backup.data

// MySQL 连接配置
async function importData() {
  const connection = await mysql.createConnection({
    host: process.env.MYSQL_HOST || 'localhost',
    port: parseInt(process.env.MYSQL_PORT || '3306'),
    user: process.env.MYSQL_USER || 'root',
    password: process.env.MYSQL_PASSWORD || '',
    database: process.env.MYSQL_DATABASE || 'ces_version',
    multipleStatements: true
  })

  try {
    console.log('开始导入数据...')

    // 1. 导入版本线
    console.log('导入版本线...')
    for (const vl of data.versionLines) {
      await connection.execute(
        'INSERT IGNORE INTO version_lines (version_line, baseline, is_active) VALUES (?, ?, ?)',
        [vl.versionLine, vl.baseline, vl.active]
      )
    }
    console.log('导入 ' + data.versionLines.length + ' 个版本线')

    // 2. 导入局点
    console.log('导入局点...')
    for (const region of data.regions) {
      await connection.execute(
        'INSERT IGNORE INTO regions (name, area, backend_version, frontend_version, target_version, backend_ready, frontend_ready) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [region.name, region.area, region.backendVersion, region.frontendVersion, region.targetVersion, region.backendReady, region.frontendReady]
      )
    }
    console.log('导入 ' + data.regions.length + ' 个局点')

    // 3. 导入组件
    console.log('导入组件...')
    for (const component of data.components) {
      await connection.execute(
        'INSERT IGNORE INTO components (name, description, type) VALUES (?, ?, ?)',
        [component.name, component.description || '', component.type]
      )
    }
    console.log('导入 ' + data.components.length + ' 个组件')

    // 4. 导入系统配置
    console.log('导入系统配置...')
    for (const key of Object.keys(data.configs)) {
      const value = data.configs[key]
      await connection.execute(
        'INSERT IGNORE INTO system_configs (config_key, config_value) VALUES (?, ?)',
        [key, String(value)]
      )
    }
    console.log('导入 ' + Object.keys(data.configs).length + ' 个配置')

    // 5. 导入计划
    console.log('导入计划...')
    for (const plan of data.plans) {
      await connection.execute(
        'INSERT IGNORE INTO plans (id, version, version_line, type, status, summary, related_requirements, related_bugs) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [plan.id, plan.version, plan.versionLine, plan.type, plan.status, plan.summary, plan.relatedRequirements, plan.relatedBugs]
      )
    }
    console.log('导入 ' + data.plans.length + ' 个计划')

    // 6. 导入计划时间线
    if (data.planTimelines) {
      console.log('导入计划时间线...')
      for (const planId of Object.keys(data.planTimelines)) {
        const timeline = data.planTimelines[planId]
        for (const key of Object.keys(timeline)) {
          const value = timeline[key]
          if (key === 'upgradeWindow') {
            await connection.execute(
              'INSERT IGNORE INTO upgrade_windows (plan_id, planned_start_date, planned_end_date) VALUES (?, ?, ?)',
              [planId, value.plannedStart, value.plannedEnd]
            )
          } else {
            await connection.execute(
              'INSERT IGNORE INTO plan_timelines (plan_id, timeline_key, planned_date, actual_date) VALUES (?, ?, ?, ?)',
              [planId, key, value.planned, value.actual]
            )
          }
        }
      }
      console.log('导入计划时间线')
    }

    // 7. 导入计划组件
    if (data.planComponents) {
      console.log('导入计划组件...')
      for (const planId of Object.keys(data.planComponents)) {
        const components = data.planComponents[planId]
        for (const comp of components) {
          await connection.execute(
            'INSERT IGNORE INTO plan_components (plan_id, component_name, component_type, current_version, target_version, enabled) VALUES (?, ?, ?, ?, ?, ?)',
            [planId, comp.name, comp.type, comp.currentVersion, comp.targetVersion, comp.enabled]
          )
        }
      }
      console.log('导入计划组件')
    }

    // 8. 导入延期原因
    if (data.planDelays) {
      console.log('导入延期原因...')
      for (const planId of Object.keys(data.planDelays)) {
        const delays = data.planDelays[planId]
        for (const key of Object.keys(delays)) {
          const delay = delays[key]
          await connection.execute(
            'INSERT IGNORE INTO plan_delays (plan_id, delay_key, delay_type, delay_reason, owner, recorded_at) VALUES (?, ?, ?, ?, ?, ?)',
            [planId, key, delay.type, delay.reason, delay.owner, delay.recordedAt]
          )
        }
      }
      console.log('导入延期原因')
    }

    console.log('\n数据导入完成！')

  } catch (error) {
    console.error('导入失败:', error)
  } finally {
    await connection.end()
  }
}

importData()
