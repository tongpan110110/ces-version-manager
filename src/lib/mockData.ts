// 模拟数据 - 用于纯前端演示
import { generateInitRegions } from './init-data'

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

export const INITIAL_REGIONS = generateInitRegions().map((region, index) => ({
  ...region,
  id: String(index + 1),
}))

export const INITIAL_REGION_VERSIONS = [
  { regionId: '1', planId: '5', backendReady: true, frontendReady: true }, // 广州友好 -> 25.10.1
  { regionId: '2', planId: '4', backendReady: true, frontendReady: true }, // 北京四 -> 25.10.0
  { regionId: '3', planId: '4', backendReady: true, frontendReady: true }, // 广州 -> 25.10.0
  { regionId: '4', planId: '4', backendReady: true, frontendReady: true }, // 上海一 -> 25.10.0
  { regionId: '5', planId: '3', backendReady: true, frontendReady: true }, // 华东二 -> 25.8.2
  { regionId: '6', planId: '3', backendReady: true, frontendReady: true }, // 贵阳一 -> 25.8.2
  { regionId: '7', planId: '3', backendReady: true, frontendReady: true }, // 香港 -> 25.8.2
  { regionId: '8', planId: '2', backendReady: true, frontendReady: true }, // 曼谷 -> 25.8.1
  { regionId: '9', planId: '2', backendReady: true, frontendReady: true }, // 新加坡 -> 25.8.1
  { regionId: '10', planId: '2', backendReady: true, frontendReady: true }, // 雅加达 -> 25.8.1
  { regionId: '11', planId: '2', backendReady: true, frontendReady: false }, // 利雅得 -> 25.8.1
  { regionId: '12', planId: '1', backendReady: true, frontendReady: true }, // 约翰内斯堡 -> 25.8.0
  { regionId: '13', planId: '2', backendReady: true, frontendReady: true }, // 墨西哥城一 -> 25.8.1
  { regionId: '14', planId: '2', backendReady: true, frontendReady: true }, // 圣保罗一 -> 25.8.1
]

export const INITIAL_CONFIGS = {
  'baseline_25.8': '25.8.2',
  'baseline_25.10': '25.10.0',
  'active_version_lines': JSON.stringify(['25.8', '25.10']),
}

// LocalStorage keys
export const STORAGE_KEYS = {
  PLANS: 'ces_version_plans',
  REGIONS: 'ces_version_regions',
  REGION_VERSIONS: 'ces_version_region_versions',
  CONFIGS: 'ces_version_configs',
}

// Initialize localStorage with mock data
export function initializeLocalStorage() {
  if (typeof window === 'undefined') return

  if (!localStorage.getItem(STORAGE_KEYS.PLANS)) {
    localStorage.setItem(STORAGE_KEYS.PLANS, JSON.stringify(INITIAL_PLANS))
  }
  if (!localStorage.getItem(STORAGE_KEYS.REGIONS)) {
    localStorage.setItem(STORAGE_KEYS.REGIONS, JSON.stringify(INITIAL_REGIONS))
  }
  if (!localStorage.getItem(STORAGE_KEYS.REGION_VERSIONS)) {
    localStorage.setItem(STORAGE_KEYS.REGION_VERSIONS, JSON.stringify(INITIAL_REGION_VERSIONS))
  }
  if (!localStorage.getItem(STORAGE_KEYS.CONFIGS)) {
    localStorage.setItem(STORAGE_KEYS.CONFIGS, JSON.stringify(INITIAL_CONFIGS))
  }
}
