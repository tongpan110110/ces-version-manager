/**
 * API 调用 Hooks
 * 使用后端 MySQL 数据库，API 失败时降级到 localStorage
 */

import { useState, useEffect } from 'react'

// localStorage keys
const STORAGE_KEYS = {
  PLANS: 'mock_plans',
  REGIONS: 'mock_regions',
  REGION_VERSIONS: 'mock_region_versions',
  CONFIGS: 'mock_configs',
  COMPONENTS: 'settings_components',
}

// 通用 API 请求函数
async function apiRequest(url: string, options?: RequestInit) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  })

  const data = await response.json()

  if (!response.ok) {
    throw new Error(data.error || '请求失败')
  }

  return data
}

// 从 localStorage 获取数据的辅助函数
function getFromLocalStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : fallback
  } catch {
    return fallback
  }
}

// 保存到 localStorage 的辅助函数
function saveToLocalStorage(key: string, data: any) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (error) {
    console.error('保存到 localStorage 失败:', error)
  }
}

// 局点管理 Hook
export function useRegions() {
  const [regions, setRegions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRegions()
  }, [])

  const fetchRegions = async () => {
    // 先尝试从 API 获取
    try {
      const result = await apiRequest('/api/regions')
      setRegions(result.data || [])
    } catch (error: any) {
      console.log('API 获取局点失败，降级到 localStorage:', error.message)
      // 降级到 localStorage
      const localRegions = getFromLocalStorage<any[]>('settings_regions', [])
      setRegions(localRegions)
    } finally {
      setLoading(false)
    }
  }

  const createRegion = async (region: any) => {
    let apiSuccess = false
    try {
      const result = await apiRequest('/api/regions', {
        method: 'POST',
        body: JSON.stringify(region),
      })
      apiSuccess = true
    } catch (error) {
      console.log('API 创建局点失败，使用 localStorage')
    }

    // 更新本地状态
    const newRegions = [...regions, { ...region, id: Date.now() }]
    setRegions(newRegions)

    // 如果 API 失败，保存到 localStorage
    if (!apiSuccess) {
      saveToLocalStorage('settings_regions', newRegions)
    } else {
      await fetchRegions()
    }

    return region
  }

  const updateRegion = async (id: number, region: any) => {
    let apiSuccess = false
    try {
      await apiRequest('/api/regions', {
        method: 'PUT',
        body: JSON.stringify({ ...region, id }),
      })
      apiSuccess = true
    } catch (error) {
      console.log('API 更新局点失败，使用 localStorage')
    }

    // 更新本地状态
    const newRegions = regions.map(r => r.id === id ? { ...region, id } : r)
    setRegions(newRegions)

    // 如果 API 失败，保存到 localStorage
    if (!apiSuccess) {
      saveToLocalStorage('settings_regions', newRegions)
    } else {
      await fetchRegions()
    }

    return region
  }

  const deleteRegion = async (id: number) => {
    let apiSuccess = false
    try {
      await apiRequest(`/api/regions?id=${id}`, { method: 'DELETE' })
      apiSuccess = true
    } catch (error) {
      console.log('API 删除局点失败，使用 localStorage')
    }

    // 更新本地状态
    const newRegions = regions.filter(r => r.id !== id)
    setRegions(newRegions)

    // 如果 API 失败，保存到 localStorage
    if (!apiSuccess) {
      saveToLocalStorage('settings_regions', newRegions)
    } else {
      await fetchRegions()
    }
  }

  return { regions, loading, createRegion, updateRegion, deleteRegion }
}

// 发布计划管理 Hook
export function usePlans() {
  const [plans, setPlans] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPlans()
  }, [])

  const fetchPlans = async (params?: { status?: string; versionLine?: string; search?: string }) => {
    // 先尝试从 API 获取
    try {
      const queryString = new URLSearchParams(params as any).toString()
      const url = queryString ? `/api/plans?${queryString}` : '/api/plans'
      const result = await apiRequest(url)
      setPlans(result.data || [])
    } catch (error: any) {
      console.log('API 获取计划失败，降级到 localStorage:', error.message)
      // 降级到 localStorage
      const localPlans = getFromLocalStorage<any[]>(STORAGE_KEYS.PLANS, [])
      // 如果有过滤条件，在本地进行过滤
      let filteredPlans = localPlans
      if (params?.status) {
        filteredPlans = filteredPlans.filter(p => p.status === params.status)
      }
      if (params?.versionLine) {
        filteredPlans = filteredPlans.filter(p => p.versionLine === params.versionLine)
      }
      if (params?.search) {
        const searchLower = params.search.toLowerCase()
        filteredPlans = filteredPlans.filter(p =>
          p.version?.toLowerCase().includes(searchLower) ||
          p.summary?.toLowerCase().includes(searchLower)
        )
      }
      setPlans(filteredPlans)
    } finally {
      setLoading(false)
    }
  }

  const createPlan = async (plan: any) => {
    let apiSuccess = false
    let createdPlan = { ...plan, id: Date.now().toString(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }

    try {
      const result = await apiRequest('/api/plans', {
        method: 'POST',
        body: JSON.stringify(plan),
      })
      createdPlan = result.data
      apiSuccess = true
    } catch (error) {
      console.log('API 创建计划失败，使用 localStorage')
    }

    // 更新本地状态
    const newPlans = [...plans, createdPlan]
    setPlans(newPlans)

    // 如果 API 失败，保存到 localStorage
    if (!apiSuccess) {
      saveToLocalStorage(STORAGE_KEYS.PLANS, newPlans)
    } else {
      await fetchPlans()
    }

    return createdPlan
  }

  const updatePlan = async (id: string, updates: any) => {
    let apiSuccess = false

    try {
      const result = await apiRequest('/api/plans', {
        method: 'PUT',
        body: JSON.stringify({ ...updates, id }),
      })
      apiSuccess = true
    } catch (error) {
      console.log('API 更新计划失败，使用 localStorage')
    }

    // 更新本地状态
    const newPlans = plans.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)
    setPlans(newPlans)

    // 如果 API 失败，保存到 localStorage
    if (!apiSuccess) {
      saveToLocalStorage(STORAGE_KEYS.PLANS, newPlans)
    } else {
      await fetchPlans()
    }

    return newPlans.find(p => p.id === id)
  }

  const deletePlan = async (id: string) => {
    let apiSuccess = false

    try {
      await apiRequest(`/api/plans?id=${id}`, { method: 'DELETE' })
      apiSuccess = true
    } catch (error) {
      console.log('API 删除计划失败，使用 localStorage')
    }

    // 更新本地状态
    const newPlans = plans.filter(p => p.id !== id)
    setPlans(newPlans)

    // 如果 API 失败，保存到 localStorage
    if (!apiSuccess) {
      saveToLocalStorage(STORAGE_KEYS.PLANS, newPlans)
    } else {
      await fetchPlans()
    }
  }

  return { plans, loading, fetchPlans, createPlan, updatePlan, deletePlan }
}

// 配置管理 Hook
export function useConfigs() {
  const [configs, setConfigs] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchConfigs()
  }, [])

  const fetchConfigs = async () => {
    // 先尝试从 API 获取
    try {
      const result = await apiRequest('/api/config')
      setConfigs(result.data || {})
    } catch (error: any) {
      console.log('API 获取配置失败，降级到 localStorage:', error.message)
      // 降级到 localStorage
      const localConfigs = getFromLocalStorage<Record<string, string>>(STORAGE_KEYS.CONFIGS, {})
      setConfigs(localConfigs)
    } finally {
      setLoading(false)
    }
  }

  const setConfig = async (key: string, value: string) => {
    let apiSuccess = false

    try {
      await apiRequest('/api/config', {
        method: 'POST',
        body: JSON.stringify({ key, value }),
      })
      apiSuccess = true
    } catch (error) {
      console.log('API 保存配置失败，使用 localStorage')
    }

    // 更新本地状态
    const newConfigs = { ...configs, [key]: value }
    setConfigs(newConfigs)

    // 如果 API 失败，保存到 localStorage
    if (!apiSuccess) {
      saveToLocalStorage(STORAGE_KEYS.CONFIGS, newConfigs)
    } else {
      await fetchConfigs()
    }
  }

  return { configs, loading, setConfig }
}

// 版本线管理 Hook
export function useVersionLines() {
  const [versionLines, setVersionLines] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVersionLines()
  }, [])

  const fetchVersionLines = async () => {
    // 先尝试从 API 获取
    try {
      const result = await apiRequest('/api/version-lines')
      setVersionLines(result.data || [])
    } catch (error: any) {
      console.log('API 获取版本线失败，降级到 localStorage:', error.message)
      // 降级到 localStorage - 从 configs 中读取版本线信息
      const configs = getFromLocalStorage<Record<string, string>>(STORAGE_KEYS.CONFIGS, {})
      const activeVersionLines = configs['active_version_lines']
        ? JSON.parse(configs['active_version_lines'])
        : ['25.8', '25.10']
      setVersionLines(activeVersionLines.map((vl: string) => ({ versionLine: vl })))
    } finally {
      setLoading(false)
    }
  }

  return { versionLines, loading }
}

// 组件管理 Hook（已在设置页面处理，这里添加降级）
export function useComponents() {
  const [components, setComponents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComponents()
  }, [])

  const fetchComponents = async () => {
    // 先尝试从 API 获取
    try {
      const result = await apiRequest('/api/components')
      setComponents(result.data || [])
    } catch (error: any) {
      console.log('API 获取组件失败，降级到 localStorage:', error.message)
      // 降级到 localStorage
      const localComponents = getFromLocalStorage<any[]>(STORAGE_KEYS.COMPONENTS, [
        { name: 'CES-Portal', description: '前端', type: 'frontend' },
        { name: 'ces-gateway', description: '网关服务', type: 'backend' },
        { name: 'ces-auth', description: '认证服务', type: 'backend' },
      ])
      setComponents(localComponents)
    } finally {
      setLoading(false)
    }
  }

  const createComponent = async (component: any) => {
    let apiSuccess = false
    try {
      await apiRequest('/api/components', {
        method: 'POST',
        body: JSON.stringify(component),
      })
      apiSuccess = true
    } catch (error) {
      console.log('API 创建组件失败，使用 localStorage')
    }

    // 更新本地状态
    const newComponents = [...components, component]
    setComponents(newComponents)

    // 如果 API 失败，保存到 localStorage
    if (!apiSuccess) {
      saveToLocalStorage(STORAGE_KEYS.COMPONENTS, newComponents)
    } else {
      await fetchComponents()
    }
  }

  const deleteComponent = async (name: string) => {
    let apiSuccess = false
    try {
      await apiRequest(`/api/components?name=${name}`, { method: 'DELETE' })
      apiSuccess = true
    } catch (error) {
      console.log('API 删除组件失败，使用 localStorage')
    }

    // 更新本地状态
    const newComponents = components.filter(c => c.name !== name)
    setComponents(newComponents)

    // 如果 API 失败，保存到 localStorage
    if (!apiSuccess) {
      saveToLocalStorage(STORAGE_KEYS.COMPONENTS, newComponents)
    } else {
      await fetchComponents()
    }
  }

  return { components, loading, createComponent, deleteComponent }
}

// 仪表盘数据 Hook
export function useDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboard()
  }, [])

  const fetchDashboard = async () => {
    // 先尝试从 API 获取
    try {
      const result = await apiRequest('/api/dashboard')
      setData(result.data)
    } catch (error: any) {
      console.log('API 获取仪表盘数据失败，降级到 localStorage 计算:', error.message)
      // 降级到 localStorage - 计算仪表盘数据
      const plans = getFromLocalStorage<any[]>(STORAGE_KEYS.PLANS, [])
      const regions = getFromLocalStorage<any[]>('settings_regions', [])
      const regionVersions = getFromLocalStorage<any[]>(STORAGE_KEYS.REGION_VERSIONS, [])
      const configs = getFromLocalStorage<Record<string, string>>(STORAGE_KEYS.CONFIGS, {})

      // Get active version lines
      const activeVersionLines: string[] = configs['active_version_lines']
        ? JSON.parse(configs['active_version_lines'])
        : ['25.8', '25.10']

      // Calculate stats
      const totalPlans = plans.length
      const draftPlans = plans.filter((p) => p.status === 'draft').length
      const testingPlans = plans.filter((p) => p.status === 'testing').length
      const readyPlans = plans.filter((p) => p.status === 'ready').length
      const releasedPlans = plans.filter((p) => p.status === 'released').length
      const totalRegions = regions.length

      // Calculate version line stats
      const versionLineStats = activeVersionLines.map((versionLine) => {
        const baseline = configs[`baseline_${versionLine}`] || ''
        const baselinePlan = plans.find((p) => p.version === baseline)

        // Get regions on this version line
        const regionsOnLine = regionVersions.filter((rv) => {
          const plan = plans.find((p) => p.id === rv.planId)
          return plan && plan.versionLine === versionLine
        })

        const atBaseline = baselinePlan
          ? regionsOnLine.filter((rv) => rv.planId === baselinePlan.id).length
          : 0
        const behindBaseline = regionsOnLine.length - atBaseline

        return {
          versionLine,
          baseline,
          totalRegions: regionsOnLine.length,
          atBaseline,
          behindBaseline,
          alignmentRate: regionsOnLine.length > 0 ? Math.round((atBaseline / regionsOnLine.length) * 100) : 0,
          coverage: totalRegions > 0 ? Math.round((regionsOnLine.length / totalRegions) * 100) : 0,
        }
      })

      const totalAlignedRegions = versionLineStats.reduce((sum, vl) => sum + vl.atBaseline, 0)
      const overallAlignmentRate = totalRegions > 0 ? Math.round((totalAlignedRegions / totalRegions) * 100) : 0

      // Get recent plans
      const recentPlans = [...plans]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        .slice(0, 5)

      setData({
        stats: {
          totalPlans,
          draftPlans,
          testingPlans,
          readyPlans,
          releasedPlans,
          totalRegions,
          totalAlignedRegions,
          overallAlignmentRate,
        },
        versionLines: versionLineStats,
        recentPlans,
      })
    } finally {
      setLoading(false)
    }
  }

  return { data, loading, fetchDashboard }
}

// 获取单个计划详情 Hook
export function usePlan(planId: string) {
  const [plan, setPlan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (planId) {
      fetchPlan()
    }
  }, [planId])

  const fetchPlan = async () => {
    if (!planId) return
    setLoading(true)
    // 先尝试从 API 获取
    try {
      const result = await apiRequest(`/api/plans/${planId}`)
      setPlan(result.data)
      setError(null)
    } catch (error: any) {
      console.log('API 获取计划详情失败，降级到 localStorage:', error.message)
      // 降级到 localStorage
      const plans = getFromLocalStorage<any[]>(STORAGE_KEYS.PLANS, [])
      const localPlan = plans.find(p => p.id === planId)
      if (localPlan) {
        setPlan(localPlan)
        setError(null)
      } else {
        setError('计划不存在')
      }
    } finally {
      setLoading(false)
    }
  }

  return { plan, loading, error, fetchPlan }
}
