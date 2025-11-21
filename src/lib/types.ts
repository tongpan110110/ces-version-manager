// Plan Types
export type PlanType = 'Release' | 'Patch'
export type PlanStatus = 'draft' | 'testing' | 'ready' | 'released' | 'deprecated'

export interface Plan {
  id: string
  version: string
  type: PlanType
  status: PlanStatus
  summary: string
  relatedRequirements: string[]
  relatedBugs: string[]
  createdAt: Date
  updatedAt: Date
}

// Manifest Types
export type ChangeType = 'upgrade' | 'unchanged' | 'new' | 'removed'

export interface ManifestComponent {
  id: string
  manifestId: string
  componentName: string
  targetVersion: string
  changeType: ChangeType
  changeReason: string
}

export interface Manifest {
  id: string
  planId: string
  frontendVersion: string
  frontendChangeType: ChangeType
  frontendChangeReason: string
  feBeCheckStatus: 'ok' | 'warn' | 'error'
  feBeCheckMessage: string
  dependencyCheckStatus: 'ok' | 'warn' | 'error'
  dependencyCheckMessage: string
  components: ManifestComponent[]
  createdAt: Date
  updatedAt: Date
}

// Region Types
export type RegionArea = 'domestic' | 'apac' | 'africa' | 'latam'

export interface Region {
  id: string
  name: string
  area: RegionArea
  currentPlanVersion: string
  backendReady: boolean
  frontendReady: boolean
  isGray: boolean
  lastUpdatedAt: Date
}

// Audit Log Types
export type AuditAction = 'create' | 'update' | 'delete' | 'status_change'

export interface AuditLog {
  id: string
  entityType: 'plan' | 'manifest' | 'region'
  entityId: string
  action: AuditAction
  field?: string
  oldValue?: string
  newValue?: string
  operator: string
  createdAt: Date
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

// Component Dictionary
export const BACKEND_COMPONENTS = [
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
] as const

export type BackendComponent = typeof BACKEND_COMPONENTS[number]

// Region Dictionary
export const REGIONS: Array<{ name: string; area: RegionArea; isGray: boolean }> = [
  // Domestic
  { name: '广州友好', area: 'domestic', isGray: true },
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
  { name: '乌兰察布-汽车一', area: 'domestic', isGray: false },
  { name: '青岛', area: 'domestic', isGray: false },
  { name: '深圳', area: 'domestic', isGray: false },
  // APAC / Middle East
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
