import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper function to extract version line from version
function getVersionLine(version: string): string {
  const parts = version.split('.')
  return `${parts[0]}.${parts[1]}`
}

// Backend components list
const BACKEND_COMPONENTS = [
  'uniagent-taskmgr',
  'telescope',
  'uniagent',
  'admin-server',
  'agent-server',
  'task-center',
  'metis',
  'event-processor',
  'api-service',
  'admin-manager',
  'consumer-adaptor',
  'ces-framework',
  'poros',
  'guard',
  'remote-monitor-scheduler',
  'remote-monitor-proxy',
  'ces-go-api',
  'alarm-router',
  'alarm-calculator',
  'alarm-manager',
  'hermes',
  'alarm-engine',
]

// Regions list (灰度局点: 广州友好、乌兰察布-汽车一)
const REGIONS = [
  // Domestic
  { name: '广州友好', area: 'domestic', isGray: true },
  { name: '乌兰察布-汽车一', area: 'domestic', isGray: true },
  { name: '北京四', area: 'domestic', isGray: false },
  { name: '广州', area: 'domestic', isGray: false },
  { name: '上海一', area: 'domestic', isGray: false },
  { name: '乌兰察布一', area: 'domestic', isGray: false },
  { name: '华东二', area: 'domestic', isGray: false },
  { name: '贵阳一', area: 'domestic', isGray: false },
  { name: '香港', area: 'domestic', isGray: false },
  { name: '北京一', area: 'domestic', isGray: false },
  { name: '北京二', area: 'domestic', isGray: false },
  { name: '上海二', area: 'domestic', isGray: false },
  { name: '青岛', area: 'domestic', isGray: false },
  { name: '深圳', area: 'domestic', isGray: false },
  // APAC
  { name: '曼谷', area: 'apac', isGray: false },
  { name: '新加坡', area: 'apac', isGray: false },
  { name: '雅加达', area: 'apac', isGray: false },
  { name: '马尼拉', area: 'apac', isGray: false },
  { name: '利雅得', area: 'apac', isGray: false },
  { name: '开罗', area: 'apac', isGray: false },
  { name: '伊斯坦布尔', area: 'apac', isGray: false },
  // Africa
  { name: '约翰内斯堡', area: 'africa', isGray: false },
  // LATAM
  { name: '墨西哥城一', area: 'latam', isGray: false },
  { name: '墨西哥城二', area: 'latam', isGray: false },
  { name: '利马一', area: 'latam', isGray: false },
  { name: '布宜诺斯艾利斯一', area: 'latam', isGray: false },
  { name: '圣保罗一', area: 'latam', isGray: false },
  { name: '圣地亚哥', area: 'latam', isGray: false },
]

async function main() {
  console.log('Seeding database...')

  // Clear existing data
  await prisma.auditLog.deleteMany()
  await prisma.regionVersion.deleteMany()
  await prisma.region.deleteMany()
  await prisma.manifestComponent.deleteMany()
  await prisma.manifest.deleteMany()
  await prisma.plan.deleteMany()
  await prisma.systemConfig.deleteMany()

  // Create regions
  console.log('Creating regions...')
  for (const region of REGIONS) {
    await prisma.region.create({
      data: region,
    })
  }

  // Create plans with manifests
  console.log('Creating plans and manifests...')

  // ============ 25.8.x Version Line ============

  // 25.8.0 - Base version
  const plan_25_8_0 = await prisma.plan.create({
    data: {
      version: '25.8.0',
      versionLine: getVersionLine('25.8.0'),
      type: 'Release',
      status: 'released',
      summary: '基线版本，所有组件版本统一为25.8.0',
      relatedRequirements: JSON.stringify(['REQ-001', 'REQ-002', 'REQ-003']),
      relatedBugs: JSON.stringify([]),
    },
  })

  await prisma.manifest.create({
    data: {
      planId: plan_25_8_0.id,
      frontendVersion: '25.8.0',
      frontendChangeType: 'new',
      frontendChangeReason: '基线版本',
      feBeCheckStatus: 'ok',
      feBeCheckMessage: '配套检查通过',
      dependencyCheckStatus: 'ok',
      dependencyCheckMessage: '依赖检查通过',
      components: {
        create: BACKEND_COMPONENTS.map(name => ({
          componentName: name,
          targetVersion: '25.8.0',
          changeType: 'new',
          changeReason: '基线版本',
        })),
      },
    },
  })

  // 25.8.1 - ces-go-api upgrade
  const plan_25_8_1 = await prisma.plan.create({
    data: {
      version: '25.8.1',
      versionLine: getVersionLine('25.8.1'),
      type: 'Release',
      status: 'released',
      summary: '紧急需求，ces-go-api组件升级',
      relatedRequirements: JSON.stringify(['REQ-004']),
      relatedBugs: JSON.stringify([]),
    },
  })

  await prisma.manifest.create({
    data: {
      planId: plan_25_8_1.id,
      frontendVersion: '25.8.0',
      frontendChangeType: 'unchanged',
      frontendChangeReason: '',
      feBeCheckStatus: 'ok',
      feBeCheckMessage: '配套检查通过',
      dependencyCheckStatus: 'ok',
      dependencyCheckMessage: '依赖检查通过',
      components: {
        create: BACKEND_COMPONENTS.map(name => ({
          componentName: name,
          targetVersion: name === 'ces-go-api' ? '25.8.1' : '25.8.0',
          changeType: name === 'ces-go-api' ? 'upgrade' : 'unchanged',
          changeReason: name === 'ces-go-api' ? 'REQ-004: 紧急API优化需求' : '',
        })),
      },
    },
  })

  // 25.8.1.1 - task-center patch
  const plan_25_8_1_1 = await prisma.plan.create({
    data: {
      version: '25.8.1.1',
      versionLine: getVersionLine('25.8.1.1'),
      type: 'Patch',
      status: 'released',
      summary: '问题补丁，task-center修复',
      relatedRequirements: JSON.stringify([]),
      relatedBugs: JSON.stringify(['BUG-001']),
    },
  })

  await prisma.manifest.create({
    data: {
      planId: plan_25_8_1_1.id,
      frontendVersion: '25.8.0',
      frontendChangeType: 'unchanged',
      frontendChangeReason: '',
      feBeCheckStatus: 'ok',
      feBeCheckMessage: '配套检查通过',
      dependencyCheckStatus: 'ok',
      dependencyCheckMessage: '依赖检查通过',
      components: {
        create: BACKEND_COMPONENTS.map(name => {
          let targetVersion = '25.8.0'
          let changeType = 'unchanged'
          let changeReason = ''

          if (name === 'ces-go-api') {
            targetVersion = '25.8.1'
          } else if (name === 'task-center') {
            targetVersion = '25.8.1.1'
            changeType = 'upgrade'
            changeReason = 'BUG-001: 任务调度死锁问题修复'
          }

          return { componentName: name, targetVersion, changeType, changeReason }
        }),
      },
    },
  })

  // 25.8.2 - Frontend update + backend convergence (25.8 Baseline)
  const plan_25_8_2 = await prisma.plan.create({
    data: {
      version: '25.8.2',
      versionLine: getVersionLine('25.8.2'),
      type: 'Release',
      status: 'released',
      summary: '前端连续需求更新，后端版本收敛',
      relatedRequirements: JSON.stringify(['REQ-005', 'REQ-006']),
      relatedBugs: JSON.stringify(['BUG-002']),
    },
  })

  await prisma.manifest.create({
    data: {
      planId: plan_25_8_2.id,
      frontendVersion: '25.8.2',
      frontendChangeType: 'upgrade',
      frontendChangeReason: 'REQ-005: 新增监控面板; REQ-006: 告警配置优化',
      feBeCheckStatus: 'ok',
      feBeCheckMessage: '配套检查通过',
      dependencyCheckStatus: 'ok',
      dependencyCheckMessage: '依赖检查通过',
      components: {
        create: BACKEND_COMPONENTS.map(name => {
          let targetVersion = '25.8.0'
          let changeType = 'unchanged'
          let changeReason = ''

          if (name === 'ces-go-api') {
            targetVersion = '25.8.1'
          } else if (name === 'task-center') {
            targetVersion = '25.8.1.1'
          } else if (name === 'alarm-manager') {
            targetVersion = '25.8.2'
            changeType = 'upgrade'
            changeReason = 'REQ-006: 告警配置优化'
          } else if (name === 'admin-server') {
            targetVersion = '25.8.2'
            changeType = 'upgrade'
            changeReason = 'BUG-002: 管理端权限问题修复'
          }

          return { componentName: name, targetVersion, changeType, changeReason }
        }),
      },
    },
  })

  // ============ 25.10.x Version Line ============

  // 25.10.0 - New major version baseline
  const plan_25_10_0 = await prisma.plan.create({
    data: {
      version: '25.10.0',
      versionLine: getVersionLine('25.10.0'),
      type: 'Release',
      status: 'released',
      summary: '新版本线基线，架构优化与性能提升',
      relatedRequirements: JSON.stringify(['REQ-101', 'REQ-102', 'REQ-103']),
      relatedBugs: JSON.stringify([]),
    },
  })

  await prisma.manifest.create({
    data: {
      planId: plan_25_10_0.id,
      frontendVersion: '25.10.0',
      frontendChangeType: 'upgrade',
      frontendChangeReason: 'REQ-101: 全新UI架构; REQ-102: 性能优化',
      feBeCheckStatus: 'ok',
      feBeCheckMessage: '配套检查通过',
      dependencyCheckStatus: 'ok',
      dependencyCheckMessage: '依赖检查通过',
      components: {
        create: BACKEND_COMPONENTS.map(name => ({
          componentName: name,
          targetVersion: '25.10.0',
          changeType: 'upgrade',
          changeReason: 'REQ-103: 架构升级至25.10',
        })),
      },
    },
  })

  // 25.10.1 - Quick fix
  const plan_25_10_1 = await prisma.plan.create({
    data: {
      version: '25.10.1',
      versionLine: getVersionLine('25.10.1'),
      type: 'Release',
      status: 'released',
      summary: '25.10灰度问题修复',
      relatedRequirements: JSON.stringify([]),
      relatedBugs: JSON.stringify(['BUG-101']),
    },
  })

  await prisma.manifest.create({
    data: {
      planId: plan_25_10_1.id,
      frontendVersion: '25.10.1',
      frontendChangeType: 'upgrade',
      frontendChangeReason: 'BUG-101: UI渲染问题修复',
      feBeCheckStatus: 'ok',
      feBeCheckMessage: '配套检查通过',
      dependencyCheckStatus: 'ok',
      dependencyCheckMessage: '依赖检查通过',
      components: {
        create: BACKEND_COMPONENTS.map(name => {
          let targetVersion = '25.10.0'
          let changeType = 'unchanged'
          let changeReason = ''

          if (name === 'admin-server') {
            targetVersion = '25.10.1'
            changeType = 'upgrade'
            changeReason = 'BUG-101: 权限校验问题修复'
          }

          return { componentName: name, targetVersion, changeType, changeReason }
        }),
      },
    },
  })

  // 25.10.2 - Testing
  const plan_25_10_2 = await prisma.plan.create({
    data: {
      version: '25.10.2',
      versionLine: getVersionLine('25.10.2'),
      type: 'Release',
      status: 'testing',
      summary: '25.10新特性：智能告警',
      relatedRequirements: JSON.stringify(['REQ-104']),
      relatedBugs: JSON.stringify([]),
    },
  })

  await prisma.manifest.create({
    data: {
      planId: plan_25_10_2.id,
      frontendVersion: '25.10.2',
      frontendChangeType: 'upgrade',
      frontendChangeReason: 'REQ-104: 智能告警配置界面',
      feBeCheckStatus: 'ok',
      feBeCheckMessage: '配套检查通过',
      dependencyCheckStatus: 'ok',
      dependencyCheckMessage: '依赖检查通过',
      components: {
        create: BACKEND_COMPONENTS.map(name => {
          let targetVersion = '25.10.0'
          let changeType = 'unchanged'
          let changeReason = ''

          if (name === 'admin-server') {
            targetVersion = '25.10.1'
          } else if (name === 'alarm-engine' || name === 'alarm-manager') {
            targetVersion = '25.10.2'
            changeType = 'upgrade'
            changeReason = 'REQ-104: 智能告警引擎'
          }

          return { componentName: name, targetVersion, changeType, changeReason }
        }),
      },
    },
  })

  // Set region versions
  console.log('Setting region versions...')
  const regions = await prisma.region.findMany()

  // Assign versions to regions
  // 灰度局点 (广州友好、乌兰察布-汽车一) 使用 25.10.1
  // 部分国内局点使用 25.8.2
  // 其他局点使用 25.8.x 版本
  for (const region of regions) {
    let planId: string
    let backendReady = true
    let frontendReady = true

    if (region.name === '广州友好' || region.name === '乌兰察布-汽车一') {
      // 灰度局点使用 25.10.1
      planId = plan_25_10_1.id
    } else if (['北京四', '广州', '上海一'].includes(region.name)) {
      // 部分国内大区使用 25.10.0（开始灰度新版本）
      planId = plan_25_10_0.id
    } else if (['华东二', '贵阳一', '香港'].includes(region.name)) {
      // 部分国内使用 25.8.2（旧版本线基线）
      planId = plan_25_8_2.id
    } else if (['新加坡', '曼谷', '雅加达'].includes(region.name)) {
      // APAC at 25.8.1.1
      planId = plan_25_8_1_1.id
    } else if (['墨西哥城一', '圣保罗一'].includes(region.name)) {
      // Some LATAM at 25.8.1
      planId = plan_25_8_1.id
    } else if (['约翰内斯堡'].includes(region.name)) {
      // Africa at base version
      planId = plan_25_8_0.id
    } else {
      // Others at 25.8.1.1
      planId = plan_25_8_1_1.id
    }

    await prisma.regionVersion.create({
      data: {
        regionId: region.id,
        planId,
        backendReady,
        frontendReady,
      },
    })
  }

  // Set system config - Multiple baselines
  console.log('Setting system config...')
  await prisma.systemConfig.createMany({
    data: [
      { key: 'baseline_25.8', value: '25.8.2' },
      { key: 'baseline_25.10', value: '25.10.0' },
      { key: 'active_version_lines', value: JSON.stringify(['25.8', '25.10']) },
    ],
  })

  console.log('Seed completed successfully!')
  console.log('Version lines: 25.8.x (stable), 25.10.x (rolling out)')
  console.log('Gray regions: 广州友好, 乌兰察布-汽车一')
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
