/**
 * 初始化数据配置
 * 用于系统首次启动时的默认数据
 * 当 API 失败时，使用这些数据作为降级
 */

// ==================== Ring 分组定义 ====================
export const RINGS: Record<string, string[]> = {
  'Ring 0': [
    '广州友好',
    '乌兰察布二零一',
    '乌兰察布二零二',
  ],
  'Ring 1': [
    '深圳',
    '布宜诺斯艾利斯',
    '利马一',
    '利雅得',
  ],
  'Ring 2': [
    '非洲-开罗',
    '土耳其-伊斯坦布尔',
    '拉美-墨西哥城一',
    '亚太-马尼拉',
    '亚太-雅加达',
    '华东二',
    '华北三',
    '汽车二',
  ],
  'Ring 3': [
    '西南-贵阳一',
    '华北-乌兰察布-汽车一',
    '华东-上海二',
    '非洲-约翰内斯堡',
    '俄罗斯-莫斯科二',
    '亚太-曼谷',
    '中国-香港',
    '拉美-圣地亚哥',
    '华北-北京二零一',
    '华北-乌兰察布二零七',
    '华东-芜湖二零一',
  ],
  'Ring 4': [
    '亚太-新加坡',
    '拉美-墨西哥城二',
    '华南-广州',
    '华北-北京一',
    '华北-北京四',
    '华北-北京二',
    '华北-乌兰察布一',
    '华东-上海一',
    '拉美-圣保罗一',
    '华南-东莞二零一',
    '西南-贵阳二零一',
  ],
}

// ==================== 局点数据 ====================
export interface InitRegion {
  id?: string
  name: string
  area: string
  backendVersion: string
  frontendVersion: string
  targetVersion: string
  backendReady: boolean
  frontendReady: boolean
}

// 根据局点名称推断区域
function getAreaByName(name: string): string {
  if (name.includes('亚太') || name.includes('曼谷') || name.includes('新加坡') ||
      name.includes('雅加达') || name.includes('马尼拉') || name.includes('中国-香港')) {
    return 'apac'
  }
  if (name.includes('非洲') || name.includes('开罗') || name.includes('约翰内斯堡') ||
      name.includes('俄罗斯') || name.includes('莫斯科') || name.includes('土耳其') ||
      name.includes('伊斯坦布尔')) {
    return 'africa'
  }
  if (name.includes('拉美') || name.includes('利马') || name.includes('布宜诺斯艾利斯') ||
      name.includes('墨西哥') || name.includes('圣地亚哥') || name.includes('圣保罗')) {
    return 'latam'
  }
  return 'domestic'
}

// 生成所有局点的初始化数据
export function generateInitRegions(): InitRegion[] {
  const allRegionNames = Object.values(RINGS).flat()

  return allRegionNames.map((name) => {
    // 华北-北京一的后端版本是 25.8.3，其他都是 25.8.2
    const isBeijing1 = name === '华北-北京一'

    // 只有广州友好和乌兰察布二零一已升级完成
    const isUpgraded = name === '广州友好' || name === '乌兰察布二零一'

    return {
      name,
      area: getAreaByName(name),
      backendVersion: isBeijing1 ? '25.8.3' : '25.8.2',
      frontendVersion: '25.8.3.1',
      targetVersion: '25.10.0',
      backendReady: isUpgraded,
      frontendReady: isUpgraded,
    }
  })
}

// 局点数据（直接使用 backup 数据）
export const INIT_REGIONS: InitRegion[] = [
  { name: '广州友好', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: true, frontendReady: true },
  { name: '乌兰察布二零一', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: true, frontendReady: true },
  { name: '乌兰察布二零二', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '深圳', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '布宜诺斯艾利斯', area: 'latam', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '利马一', area: 'latam', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '利雅得', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '非洲-开罗', area: 'africa', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '土耳其-伊斯坦布尔', area: 'africa', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '拉美-墨西哥城一', area: 'latam', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '亚太-马尼拉', area: 'apac', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '亚太-雅加达', area: 'apac', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '华东二', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '华北三', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '汽车二', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '西南-贵阳一', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '华北-乌兰察布-汽车一', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '华东-上海二', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '非洲-约翰内斯堡', area: 'africa', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '俄罗斯-莫斯科二', area: 'africa', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '亚太-曼谷', area: 'apac', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '中国-香港', area: 'apac', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '拉美-圣地亚哥', area: 'latam', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '华北-北京二零一', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '华北-乌兰察布二零七', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '华东-芜湖二零一', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '亚太-新加坡', area: 'apac', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '拉美-墨西哥城二', area: 'latam', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '华南-广州', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '华北-北京一', area: 'domestic', backendVersion: '25.8.3', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '华北-北京四', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '华北-北京二', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '华北-乌兰察布一', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '华东-上海一', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '拉美-圣保罗一', area: 'latam', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '华南-东莞二零一', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
  { name: '西南-贵阳二零一', area: 'domestic', backendVersion: '25.8.2', frontendVersion: '25.8.3.1', targetVersion: '25.10.0', backendReady: false, frontendReady: false },
].map((r, i) => ({ ...r, id: String(i + 1) }))

// ==================== 发布计划数据 ====================
export interface InitPlan {
  id: string
  version: string
  versionLine: string
  type: string
  status: string
  summary: string
  relatedRequirements: string
  relatedBugs: string
  createdAt: string
  updatedAt: string
}

export const INIT_PLANS: InitPlan[] = [
  {
    id: '4',
    version: '25.10.0',
    versionLine: '25.10',
    type: 'Feature Release',
    status: 'upgrading',
    summary: '25.10.0的基线版本',
    relatedRequirements: '[\"REQ-101\",\"REQ-102\"]',
    relatedBugs: '[]',
    createdAt: '2024-04-01T00:00:00.000Z',
    updatedAt: '2026-01-15T03:03:18.617Z',
  },
  {
    id: '1768445696762',
    version: '26.1.0',
    versionLine: '26.1',
    type: 'Feature Release',
    status: 'testing',
    summary: '当前Beta_T1测试阶段',
    relatedRequirements: '[]',
    relatedBugs: '[]',
    createdAt: '2026-01-15T02:54:56.762Z',
    updatedAt: '2026-01-15T08:41:52.635Z',
  },
]

// ==================== 组件数据 ====================
export interface InitComponent {
  name: string
  description: string
  type: string
}

export const INIT_COMPONENTS: InitComponent[] = [
  { name: 'CES-Portal', description: '前端', type: 'frontend' },
  { name: 'CES-GO-API', description: '', type: 'backend' },
  { name: 'CES-HERMES', description: '', type: 'backend' },
  { name: 'CES-ALARM', description: '', type: 'backend' },
  { name: 'CES-ALARM-ROUTER', description: '', type: 'backend' },
  { name: 'CES-ALARM-CALCULATOR', description: '', type: 'backend' },
  { name: 'CES-ALARM-MANAGER', description: '', type: 'backend' },
  { name: 'CES-CONSUMER-ADAPTOR', description: '', type: 'backend' },
  { name: 'CES-TASK-CENTER', description: '', type: 'backend' },
  { name: 'CES-POROS', description: '', type: 'backend' },
  { name: 'CES-METIS', description: '', type: 'backend' },
  { name: 'CES-SCHEDULER', description: '', type: 'backend' },
  { name: 'CES-EVENTPROCESSOR', description: '', type: 'backend' },
  { name: 'CES-AdminServer', description: '', type: 'backend' },
  { name: 'CES-ADMIN-MANAGER', description: '', type: 'backend' },
  { name: 'CES-AGENTSERVER', description: '', type: 'backend' },
  { name: 'CES-UniagentTaskMgr', description: '', type: 'backend' },
  { name: 'CES-UniAgentAgent', description: '', type: 'backend' },
  { name: 'CES-TELESCOPE', description: '', type: 'backend' },
]

// ==================== 系统配置数据 ====================
export interface InitSystemConfig {
  key: string
  value: string
}

export const INIT_SYSTEM_CONFIGS: InitSystemConfig[] = [
  { key: 'baseline_25.8', value: '25.8.2' },
  { key: 'baseline_25.10', value: '25.10.0' },
  { key: 'active_version_lines', value: '[\"25.8\",\"25.10\"]' },
]

// configs 对象格式
export const INIT_CONFIGS = {
  'baseline_25.8': '25.8.2',
  'baseline_25.10': '25.10.0',
  'active_version_lines': '[\"25.8\",\"25.10\"]',
}

// ==================== 计划组件配置 ====================
export interface InitPlanComponent {
  name: string
  type: string
  currentVersion: string
  targetVersion: string
  enabled: boolean
}

export const INIT_PLAN_COMPONENTS: Record<string, InitPlanComponent[]> = {
  '4': [
    { name: 'CES-Portal', type: 'frontend', currentVersion: '25.8.3.1', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-GO-API', type: 'backend', currentVersion: '25.8.2', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-HERMES', type: 'backend', currentVersion: '25.8.0', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-ALARM', type: 'backend', currentVersion: '25.8.0', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-ALARM-ROUTER', type: 'backend', currentVersion: '25.8.0', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-ALARM-CALCULATOR', type: 'backend', currentVersion: '25.8.0', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-ALARM-MANAGER', type: 'backend', currentVersion: '25.8.0', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-CONSUMER-ADAPTOR', type: 'backend', currentVersion: '25.8.0.2', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-TASK-CENTER', type: 'backend', currentVersion: '25.8.1.1', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-POROS', type: 'backend', currentVersion: '25.7.0', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-METIS', type: 'backend', currentVersion: '25.7.0', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-SCHEDULER', type: 'backend', currentVersion: '25.7.0', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-EVENTPROCESSOR', type: 'backend', currentVersion: '25.7.0', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-AdminServer', type: 'backend', currentVersion: '25.7.0', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-ADMIN-MANAGER', type: 'backend', currentVersion: '25.8.2', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-AGENTSERVER', type: 'backend', currentVersion: '25.8.2', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-UniagentTaskMgr', type: 'backend', currentVersion: '25.8.2', targetVersion: '25.10.0', enabled: true },
    { name: 'CES-UniAgentAgent', type: 'backend', currentVersion: '0.2.3', targetVersion: '0.2.5', enabled: true },
    { name: 'CES-TELESCOPE', type: 'backend', currentVersion: '2.7.6', targetVersion: '2.8.2', enabled: true },
  ],
  '1768445696762': [
    { name: 'CES-Portal', type: 'frontend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-GO-API', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-HERMES', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-ALARM', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-ALARM-ROUTER', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-ALARM-CALCULATOR', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-ALARM-MANAGER', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-CONSUMER-ADAPTOR', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-TASK-CENTER', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-POROS', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-METIS', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-SCHEDULER', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-EVENTPROCESSOR', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-AdminServer', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-ADMIN-MANAGER', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-AGENTSERVER', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
    { name: 'CES-UniagentTaskMgr', type: 'backend', currentVersion: '25.10.0', targetVersion: '26.1.0', enabled: true },
  ],
}

// ==================== 计划时间线配置 ====================
export interface InitPlanTimeline {
  planned?: string
  actual?: string
  plannedStart?: string
  plannedEnd?: string
  actualStart?: string
  actualEnd?: string
}

export const INIT_PLAN_TIMELINES: Record<string, Record<string, InitPlanTimeline>> = {
  '1768445696762': {
    devStart: { planned: '2026-01-09', actual: '2026-01-09' },
    testStart: { planned: '2026-02-14' },
    package: { planned: '2026-02-26' },
    upgradeWindow: { plannedStart: '2026-02-27', plannedEnd: '2026-04-30' },
  },
}

// ==================== 计划延期原因 ====================
export interface InitDelayReason {
  type: string
  reason: string
  owner: string
  recordedAt: string
}

export const INIT_PLAN_DELAYS: Record<string, Record<string, InitDelayReason>> = {
  '1768445696762': {
    package: {
      type: '需求变更',
      reason: 'xxxxx',
      owner: 'xxx',
      recordedAt: '2026-01-19T06:41:03.685Z',
    },
  },
}

// ==================== localStorage Keys ====================
export const STORAGE_KEYS = {
  PLANS: 'ces_version_plans',
  REGIONS: 'ces_version_regions',
  CONFIGS: 'ces_version_configs',
  COMPONENTS: 'settings_components',
  RINGS: 'ces_version_rings',
  PLAN_TIMELINES: 'ces_plan_timelines',
  PLAN_COMPONENTS: 'ces_plan_components',
  PLAN_DELAYS: 'ces_plan_delays',
} as const

// ==================== 初始化 localStorage ====================
export function initializeLocalStorage() {
  if (typeof window === 'undefined') return

  // 发布计划
  if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INIT_PLANS))
  }

  // 局点
  if (!localStorage.getItem(STORAGE_KEYS.REGIONS)) {
    localStorage.setItem(STORAGE_KEYS.REGIONS, JSON.stringify(INIT_REGIONS))
  }

  // 系统配置
  if (!localStorage.getItem(STORAGE_KEYS.CONFIGS)) {
    localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(INIT_CONFIGS))
  }

  // 组件
  if (!localStorage.getItem(STORAGE_KEYS.COMPONENTS)) {
    localStorage.setItem(STORAGE_KEYS.COMPONENTS, JSON.stringify(INIT_COMPONENTS))
  }

  // Ring 分组
  if (!localStorage.getItem(STORAGE_KEYS.RINGS)) {
    localStorage.setItem(STORAGE_KEYS.RINGS, JSON.stringify(RINGS))
  }

  // 计划组件配置
  if (!localStorage.getItem(STORAGE_KEYS.PLAN_COMPONENTS)) {
    localStorage.setItem(STORAGE_KEYS.PLAN_COMPONENTS, JSON.stringify(INIT_PLAN_COMPONENTS))
  }

  // 计划时间线
  if (!localStorage.getItem(STORAGE_KEYS.PLAN_TIMELINES)) {
    localStorage.setItem(STORAGE_KEYS.PLAN_TIMELINES, JSON.stringify(INIT_PLAN_TIMELINES))
  }

  // 计划延期原因
  if (!localStorage.getItem(STORAGE_KEYS.PLAN_DELAYS)) {
    localStorage.setItem(STORAGE_KEYS.PLAN_DELAYS, JSON.stringify(INIT_PLAN_DELAYS))
  }
}

// ==================== 获取所有初始化数据 ====================
export function getInitData() {
  return {
    rings: RINGS,
    regions: INIT_REGIONS,
    plans: INIT_PLANS,
    components: INIT_COMPONENTS,
    configs: INIT_CONFIGS,
    planComponents: INIT_PLAN_COMPONENTS,
    planTimelines: INIT_PLAN_TIMELINES,
    planDelays: INIT_PLAN_DELAYS,
    systemConfigs: INIT_SYSTEM_CONFIGS,
  }
}
