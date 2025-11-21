import { useState, useEffect } from 'react'
import { STORAGE_KEYS, initializeLocalStorage } from '@/lib/mockData'

export function useLocalData<T>(key: string, initialValue: T) {
  const [data, setData] = useState<T>(initialValue)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Initialize localStorage on mount
    initializeLocalStorage()

    // Load data from localStorage
    try {
      const stored = localStorage.getItem(key)
      if (stored) {
        setData(JSON.parse(stored))
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error)
    } finally {
      setLoading(false)
    }
  }, [key])

  const updateData = (newData: T | ((prev: T) => T)) => {
    setData((prev) => {
      const updated = typeof newData === 'function' ? (newData as (prev: T) => T)(prev) : newData
      try {
        localStorage.setItem(key, JSON.stringify(updated))
      } catch (error) {
        console.error('Error saving to localStorage:', error)
      }
      return updated
    })
  }

  return { data, setData: updateData, loading }
}

// Plans API mock
export function usePlans() {
  const { data: plans, setData: setPlans, loading } = useLocalData<any[]>(STORAGE_KEYS.PLANS, [])

  const createPlan = (plan: any) => {
    const newPlan = {
      ...plan,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    setPlans((prev: any[]) => [...prev, newPlan])
    return newPlan
  }

  const updatePlan = (id: string, updates: any) => {
    setPlans((prev: any[]) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p
      )
    )
  }

  const deletePlan = (id: string) => {
    updatePlan(id, { status: 'deprecated' })
  }

  return { plans, createPlan, updatePlan, deletePlan, loading }
}

// Regions API mock
export function useRegions() {
  const { data: regions, setData: setRegions, loading: regionsLoading } = useLocalData<any[]>(STORAGE_KEYS.REGIONS, [])
  const { data: regionVersions, setData: setRegionVersions, loading: versionsLoading } = useLocalData<any[]>(STORAGE_KEYS.REGION_VERSIONS, [])
  const { data: plans } = useLocalData<any[]>(STORAGE_KEYS.PLANS, [])
  const { data: configs } = useLocalData<Record<string, string>>(STORAGE_KEYS.CONFIGS, {})

  const loading = regionsLoading || versionsLoading

  // Combine regions with their current versions
  const regionsWithVersions = regions.map((region) => {
    const rv = regionVersions.find((v) => v.regionId === region.id)
    const plan = rv ? plans.find((p) => p.id === rv.planId) : null

    return {
      ...region,
      currentVersion: rv && plan ? {
        plan,
        backendReady: rv.backendReady,
        frontendReady: rv.frontendReady,
      } : null,
    }
  })

  // Get baselines
  const baselines: Record<string, string> = {}
  Object.keys(configs).forEach((key) => {
    if (key.startsWith('baseline_')) {
      const versionLine = key.replace('baseline_', '')
      baselines[versionLine] = configs[key]
    }
  })

  // Get active version lines
  const versionLines = configs['active_version_lines']
    ? JSON.parse(configs['active_version_lines'])
    : []

  const updateRegionVersion = (regionId: string, planId: string, backendReady: boolean, frontendReady: boolean) => {
    setRegionVersions((prev: any[]) => {
      const existing = prev.find((v) => v.regionId === regionId)
      if (existing) {
        return prev.map((v) =>
          v.regionId === regionId ? { ...v, planId, backendReady, frontendReady } : v
        )
      } else {
        return [...prev, { regionId, planId, backendReady, frontendReady }]
      }
    })
  }

  return {
    regions: regionsWithVersions,
    baselines,
    versionLines,
    updateRegionVersion,
    loading,
  }
}

// Configs API mock
export function useConfigs() {
  const { data: configs, setData: setConfigs, loading } = useLocalData<Record<string, string>>(STORAGE_KEYS.CONFIGS, {})

  const updateConfig = (key: string, value: string) => {
    setConfigs((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return { configs, updateConfig, loading }
}

// Dashboard API mock
export function useDashboard() {
  const { data: plans } = useLocalData<any[]>(STORAGE_KEYS.PLANS, [])
  const { data: regions } = useLocalData<any[]>(STORAGE_KEYS.REGIONS, [])
  const { data: regionVersions } = useLocalData<any[]>(STORAGE_KEYS.REGION_VERSIONS, [])
  const { data: configs } = useLocalData<Record<string, string>>(STORAGE_KEYS.CONFIGS, {})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Simulate loading delay
    const timer = setTimeout(() => setLoading(false), 100)
    return () => clearTimeout(timer)
  }, [])

  // Get active version lines
  const activeVersionLines: string[] = configs['active_version_lines']
    ? JSON.parse(configs['active_version_lines'])
    : []

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

  return {
    loading,
    data: {
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
    },
  }
}
