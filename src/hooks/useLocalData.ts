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
    setPlans((prev: any[]) => prev.filter((p) => p.id !== id))
  }

  return { plans, createPlan, updatePlan, deletePlan, loading }
}

// Ring 分组定义 - 固定不变
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

// 初始化所有局点数据
function initializeRegions(): any[] {
  const allRegionNames = Object.values(RINGS).flat()

  return allRegionNames.map((name) => {
    // 华北-北京一的后端版本是 25.8.3，其他都是 25.8.2
    const isBeijing1 = name === '华北-北京一'

    // 根据局点名称推断区域
    let area = 'domestic'
    if (name.includes('亚太') || name.includes('曼谷') || name.includes('新加坡') || name.includes('雅加达') || name.includes('马尼拉') || name.includes('中国-香港')) {
      area = 'apac'
    } else if (name.includes('非洲') || name.includes('开罗') || name.includes('约翰内斯堡') || name.includes('俄罗斯') || name.includes('莫斯科') || name.includes('土耳其') || name.includes('伊斯坦布尔')) {
      area = 'africa'
    } else if (name.includes('拉美') || name.includes('利马') || name.includes('布宜诺斯艾利斯') || name.includes('墨西哥') || name.includes('圣地亚哥') || name.includes('圣保罗')) {
      area = 'latam'
    }

    // 只有广州友好和乌兰察布二零一已升级完成
    const isUpgraded = name === '广州友好' || name === '乌兰察布二零一'

    return {
      name,
      area,
      backendVersion: isBeijing1 ? '25.8.3' : '25.8.2',
      frontendVersion: '25.8.3.1',
      targetVersion: '25.10.0',
      backendReady: isUpgraded,
      frontendReady: isUpgraded,
    }
  })
}

// Regions API mock
export function useRegions() {
  const [initialized, setInitialized] = useState(false)
  const { data: regions, setData: setRegions, loading: regionsLoading } = useLocalData<any[]>('settings_regions', [])
  const { data: configs } = useLocalData<Record<string, string>>(STORAGE_KEYS.CONFIGS, {})

  // 自动初始化：如果 localStorage 中没有数据或数据无效，则创建初始数据
  useEffect(() => {
    if (typeof window !== 'undefined' && !initialized) {
      const stored = localStorage.getItem('settings_regions')
      let shouldInitialize = false

      if (!stored || stored === '[]') {
        shouldInitialize = true
      } else {
        try {
          const parsed = JSON.parse(stored)
          // 检查数据是否有效（必须有 name, backendVersion, frontendVersion, targetVersion 等字段）
          if (!Array.isArray(parsed) || parsed.length === 0 || !parsed[0]?.backendVersion) {
            shouldInitialize = true
          }
        } catch (e) {
          shouldInitialize = true
        }
      }

      if (shouldInitialize) {
        const initialRegions = initializeRegions()
        setRegions(initialRegions)
        localStorage.setItem('settings_regions', JSON.stringify(initialRegions))
        console.log('重新初始化局点数据', initialRegions.length, '个局点')
      }

      setInitialized(true)
    }
  }, [initialized])

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

  return {
    regions,
    baselines,
    versionLines,
    loading: regionsLoading,
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
