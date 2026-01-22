/**
 * API 调用 Hooks
 * 替代 localStorage，使用后端 MySQL 数据库
 */

import { useState, useEffect } from 'react'

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

// 局点管理 Hook
export function useRegions() {
  const [regions, setRegions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchRegions()
  }, [])

  const fetchRegions = async () => {
    try {
      const result = await apiRequest('/api/regions')
      setRegions(result.data || [])
    } catch (error: any) {
      console.error('获取局点失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const createRegion = async (region: any) => {
    const result = await apiRequest('/api/regions', {
      method: 'POST',
      body: JSON.stringify(region),
    })
    await fetchRegions()
    return result.data
  }

  const updateRegion = async (id: number, region: any) => {
    const result = await apiRequest('/api/regions', {
      method: 'PUT',
      body: JSON.stringify({ ...region, id }),
    })
    await fetchRegions()
    return result.data
  }

  const deleteRegion = async (id: number) => {
    await apiRequest(`/api/regions?id=${id}`, { method: 'DELETE' })
    await fetchRegions()
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
    try {
      const queryString = new URLSearchParams(params as any).toString()
      const url = queryString ? `/api/plans?${queryString}` : '/api/plans'
      const result = await apiRequest(url)
      setPlans(result.data || [])
    } catch (error: any) {
      console.error('获取计划失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const createPlan = async (plan: any) => {
    const result = await apiRequest('/api/plans', {
      method: 'POST',
      body: JSON.stringify(plan),
    })
    await fetchPlans()
    return result.data
  }

  const updatePlan = async (id: string, updates: any) => {
    const result = await apiRequest('/api/plans', {
      method: 'PUT',
      body: JSON.stringify({ ...updates, id }),
    })
    await fetchPlans()
    return result.data
  }

  const deletePlan = async (id: string) => {
    await apiRequest(`/api/plans?id=${id}`, { method: 'DELETE' })
    await fetchPlans()
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
    try {
      const result = await apiRequest('/api/config')
      setConfigs(result.data || {})
    } catch (error: any) {
      console.error('获取配置失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const setConfig = async (key: string, value: string) => {
    await apiRequest('/api/config', {
      method: 'POST',
      body: JSON.stringify({ key, value }),
    })
    await fetchConfigs()
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
    try {
      const result = await apiRequest('/api/version-lines')
      setVersionLines(result.data || [])
    } catch (error: any) {
      console.error('获取版本线失败:', error)
    } finally {
      setLoading(false)
    }
  }

  return { versionLines, loading }
}

// 组件管理 Hook
export function useComponents() {
  const [components, setComponents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchComponents()
  }, [])

  const fetchComponents = async () => {
    try {
      const result = await apiRequest('/api/components')
      setComponents(result.data || [])
    } catch (error: any) {
      console.error('获取组件失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const createComponent = async (component: any) => {
    await apiRequest('/api/components', {
      method: 'POST',
      body: JSON.stringify(component),
    })
    await fetchComponents()
  }

  const deleteComponent = async (name: string) => {
    await apiRequest(`/api/components?name=${name}`, { method: 'DELETE' })
    await fetchComponents()
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
    try {
      const result = await apiRequest('/api/dashboard')
      setData(result.data)
    } catch (error: any) {
      console.error('获取仪表盘数据失败:', error)
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
    try {
      const result = await apiRequest(`/api/plans/${planId}`)
      setPlan(result.data)
      setError(null)
    } catch (error: any) {
      console.error('获取计划详情失败:', error)
      setError(error.message || '获取失败')
    } finally {
      setLoading(false)
    }
  }

  return { plan, loading, error, fetchPlan }
}
