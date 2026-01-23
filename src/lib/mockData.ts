// 模拟数据 - 完全使用 init-data.ts 中的配置
import { generateInitRegions, RINGS, INIT_SYSTEM_CONFIGS } from './init-data'

export const INITIAL_PLANS = [
  {
    id: '1',
    version: '25.8.0',
    versionLine: '25.8',
    type: 'Release',
    status: 'released',
    summary: '基线版本，所有组件版本统一为25.8.0',
    relatedRequirements: JSON.stringify(['REQ-001', 'REQ-002']),
    relatedBugs: JSON.stringify([]),
    createdAt: new Date('2024-01-01').toISOString(),
    updatedAt: new Date('2024-01-01').toISOString(),
  },
  {
    id: '2',
    version: '25.8.1',
    versionLine: '25.8',
    type: 'Release',
    status: 'released',
    summary: '紧急需求，ces-go-api组件升级',
    relatedRequirements: JSON.stringify(['REQ-004']),
    relatedBugs: JSON.stringify([]),
    createdAt: new Date('2024-02-01').toISOString(),
    updatedAt: new Date('2024-02-01').toISOString(),
  },
  {
    id: '3',
    version: '25.8.2',
    versionLine: '25.8',
    type: 'Release',
    status: 'released',
    summary: '前端连续需求更新，后端版本收敛',
    relatedRequirements: JSON.stringify(['REQ-005', 'REQ-006']),
    relatedBugs: JSON.stringify(['BUG-002']),
    createdAt: new Date('2024-03-01').toISOString(),
    updatedAt: new Date('2024-03-01').toISOString(),
  },
  {
    id: '4',
    version: '25.10.0',
    versionLine: '25.10',
    type: 'Release',
    status: 'released',
    summary: '新版本线基线，架构优化与性能提升',
    relatedRequirements: JSON.stringify(['REQ-101', 'REQ-102']),
    relatedBugs: JSON.stringify([]),
    createdAt: new Date('2024-04-01').toISOString(),
    updatedAt: new Date('2024-04-01').toISOString(),
  },
  {
    id: '5',
    version: '25.10.1',
    versionLine: '25.10',
    type: 'Release',
    status: 'released',
    summary: '25.10灰度问题修复',
    relatedRequirements: JSON.stringify([]),
    relatedBugs: JSON.stringify(['BUG-101']),
    createdAt: new Date('2024-05-01').toISOString(),
    updatedAt: new Date('2024-05-01').toISOString(),
  },
]

// 使用 init-data.ts 中的 generateInitRegions
export const INITIAL_REGIONS = generateInitRegions().map((region, index) => ({
  ...region,
  id: String(index + 1),
}))

// 使用 init-data.ts 中的 INIT_SYSTEM_CONFIGS
export const INITIAL_CONFIGS = INIT_SYSTEM_CONFIGS.reduce((acc, config) => {
  acc[config.key] = config.value
  return acc
}, {} as Record<string, string>)

// 使用 init-data.ts 中的 RINGS
export const INITIAL_RINGS = RINGS

// LocalStorage keys
export const STORAGE_KEYS = {
  PLANS: 'ces_version_plans',
  REGIONS: 'ces_version_regions',
  REGION_VERSIONS: 'ces_version_region_versions',
  CONFIGS: 'ces_version_configs',
  RINGS: 'ces_version_rings',
}

// Initialize localStorage with init-data.ts 配置
export function initializeLocalStorage() {
  if (typeof window === 'undefined') return

  if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS))
  }
  if (!localStorage.getItem(STORAGE_KEYS.REGIONS)) {
    localStorage.setItem(STORAGE_KEYS.REGIONS, JSON.stringify(INITIAL_REGIONS))
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONFIGS)) {
    localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(INITIAL_CONFIGS))
  }
  if (!localStorage.getItem(STORAGE_KEYS.RINGS)) {
    localStorage.setItem(STORAGE_KEYS.RINGS, JSON.stringify(INITIAL_RINGS))
  }
}
