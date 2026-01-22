'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Rocket, FileText, Package, TrendingUp, CalendarClock, AlertTriangle } from 'lucide-react'
import { useDashboard, useRegions, usePlans, useVersionLines } from '@/hooks/useAPI'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface Plan {
  id: string
  version: string
  versionLine: string
  type: string
  status: string
  summary: string
  createdAt: string
  updatedAt: string
}

interface PlanTimeline {
  devStart?: { planned?: string; actual?: string }
  testStart?: { planned?: string; actual?: string }
  package?: { planned?: string; actual?: string }
  upgradeWindow?: {
    plannedStart?: string
    plannedEnd?: string
    actualStart?: string
    actualEnd?: string
  }
}

interface BlockerItem {
  id: string
  title: string
  severity?: 'P0' | 'P1' | 'P2' | 'P3'
  status?: 'open' | 'in_progress' | 'resolved'
  owner?: string
  updatedAt?: string
}

export default function DashboardPage() {
  const router = useRouter()
  const { loading, data } = useDashboard()
  const { regions } = useRegions()
  const { plans: allPlans } = usePlans()
  const [selectedVersionLine, setSelectedVersionLine] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  // 使用 useVersionLines 获取版本线数据
  const { versionLines } = useVersionLines()

  // 客户端挂载后再读取数据
  useEffect(() => {
    setMounted(true)
  }, [])

  // 更新 URL 参数
  const updateURL = useCallback((version: string) => {
    if (typeof window === 'undefined') return
    const url = new URL(window.location.href)
    url.searchParams.set('version', version)
    router.replace(`${url.pathname}${url.search}`)
  }, [router])

  useEffect(() => {
    // 优先从 URL 读取版本线，如果没有则使用最高版本线
    if (mounted && data && versionLines.length > 0 && !selectedVersionLine) {
      const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
      const urlVersion = urlParams.get('version')
      const isValidVersion = versionLines.some(vl => vl.versionLine === urlVersion)

      if (urlVersion && isValidVersion) {
        setSelectedVersionLine(urlVersion)
      } else {
        // 使用最高版本线作为默认值
        const sorted = [...versionLines].sort((a, b) => {
          const [aMajor, aMinor] = a.versionLine.split('.').map(Number)
          const [bMajor, bMinor] = b.versionLine.split('.').map(Number)
          if (aMajor !== bMajor) return bMajor - aMajor
          return bMinor - aMinor
        })
        const defaultVersion = sorted[0].versionLine
        setSelectedVersionLine(defaultVersion)
      }
    }
  }, [data, selectedVersionLine, mounted])

  // 当版本线变化时更新 URL
  useEffect(() => {
    if (mounted && selectedVersionLine) {
      const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '')
      if (urlParams.get('version') !== selectedVersionLine) {
        updateURL(selectedVersionLine)
      }
    }
  }, [selectedVersionLine, mounted, updateURL])

  if (loading || !mounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">加载失败</div>
      </div>
    )
  }

  const getVersionLineFromVersion = (version?: string | null) => {
    if (!version) return null
    const parts = version.split('.')
    if (parts.length < 2) return null
    return `${parts[0]}.${parts[1]}`
  }

  const getBaselinePlan = (versionLine: string) => {
    const baseline = versionLines.find(vl => vl.versionLine === versionLine)?.baseline
    return allPlans.find(p => p.version === baseline && p.versionLine === versionLine)
  }

  // 计算升级进度（后端和前端分开）
  const getUpgradeProgress = (versionLine: string, targetVersion?: string) => {
    const versionLineRegions = regions.filter(r => {
      if (targetVersion) {
        return r.targetVersion === targetVersion
      }
      const targetVersionLine = getVersionLineFromVersion(r.targetVersion)
      return targetVersionLine === versionLine
    })

    const total = versionLineRegions.length
    if (total === 0) return { backend: { ready: 0, total }, frontend: { ready: 0, total }, total: 0 }

    const backendReady = versionLineRegions.filter(r => r.backendReady).length
    const frontendReady = versionLineRegions.filter(r => r.frontendReady).length

    return {
      backend: { ready: backendReady, total },
      frontend: { ready: frontendReady, total },
      total: versionLineRegions.length,
    }
  }

  // 获取当前版本线正在升级的版本
  const getUpgradingPlan = (versionLine: string) => {
    return allPlans
      .filter(p => p.versionLine === versionLine && p.status === 'upgrading')
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0]
  }

  // 按状态分类计划
  const getPlansByStatus = (versionLine: string, status: string) => {
    return allPlans
      .filter(p => p.versionLine === versionLine && p.status === status)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3)
  }

  // 获取统计数据
  const getStats = (versionLine: string) => {
    const versionLinePlans = allPlans.filter(p => p.versionLine === versionLine)
    const upgradingCount = versionLinePlans.filter(p => p.status === 'upgrading').length
    const versionLineRegions = regions.filter(r => {
      const targetVersionLine = getVersionLineFromVersion(r.targetVersion)
      return targetVersionLine === versionLine
    })
    const upgradedRegions = versionLineRegions.filter(r => r.backendReady && r.frontendReady).length

    return {
      totalPlans: versionLinePlans.length,
      upgradingCount,
      upgradedRegions,
    }
  }

  const parseDate = (value?: string) => {
    if (!value) return null
    const [year, month, day] = value.split('-').map(Number)
    if (!year || !month || !day) return null
    const date = new Date(year, month - 1, day)
    date.setHours(0, 0, 0, 0)
    return date
  }

  const formatDate = (value?: string) => value || '--'

  const formatRange = (start?: string, end?: string) => {
    return `${start || '--'} ~ ${end || '--'}`
  }

  const formatRangeOptional = (start?: string, end?: string) => {
    if (start && end) return `${start} ~ ${end}`
    if (start) return start
    if (end) return end
    return ''
  }

  const getDelayDays = (planned?: string, actual?: string) => {
    const plannedDate = parseDate(planned)
    if (!plannedDate) return null
    const actualDate = actual ? parseDate(actual) : null
    const compareDate = actualDate ?? new Date()
    compareDate.setHours(0, 0, 0, 0)
    if (!actualDate && compareDate <= plannedDate) return null
    const diff = compareDate.getTime() - plannedDate.getTime()
    if (diff <= 0) return null
    return Math.ceil(diff / (24 * 60 * 60 * 1000))
  }

  const loadPlanTimeline = (planId: string): PlanTimeline | null => {
    if (typeof window === 'undefined') return null
    const stored = localStorage.getItem(`plan_timeline_${planId}`)
    if (!stored) return null
    try {
      return JSON.parse(stored)
    } catch {
      return null
    }
  }

  const loadPlanBlockers = (planId: string): BlockerItem[] => {
    if (typeof window === 'undefined') return []
    const stored = localStorage.getItem(`plan_blockers_${planId}`)
    if (!stored) return []
    try {
      const parsed = JSON.parse(stored)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }

  const sortBlockers = (items: BlockerItem[]) => {
    const severityOrder: Record<string, number> = { P0: 0, P1: 1, P2: 2, P3: 3 }
    const statusOrder: Record<string, number> = { open: 0, in_progress: 1, resolved: 2 }
    return [...items].sort((a, b) => {
      const severityDiff = (severityOrder[a.severity || 'P3'] ?? 4) - (severityOrder[b.severity || 'P3'] ?? 4)
      if (severityDiff !== 0) return severityDiff
      const statusDiff = (statusOrder[a.status || 'open'] ?? 3) - (statusOrder[b.status || 'open'] ?? 3)
      if (statusDiff !== 0) return statusDiff
      return new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime()
    })
  }

  const getSeverityVariant = (severity?: string) => {
    switch (severity) {
      case 'P0':
        return 'destructive'
      case 'P1':
        return 'warning'
      case 'P2':
        return 'secondary'
      case 'P3':
      default:
        return 'outline'
    }
  }

  const getStatusVariant = (status?: string) => {
    switch (status) {
      case 'resolved':
        return 'success'
      case 'in_progress':
        return 'warning'
      default:
        return 'destructive'
    }
  }

  const getStatusLabel = (status?: string) => {
    switch (status) {
      case 'resolved':
        return '已解决'
      case 'in_progress':
        return '处理中'
      default:
        return '未解决'
    }
  }

  const upgradingPlan = selectedVersionLine ? getUpgradingPlan(selectedVersionLine) : null
  const baselinePlan = selectedVersionLine ? getBaselinePlan(selectedVersionLine) : null
  const dashboardPlan = upgradingPlan ?? baselinePlan ?? null
  const dashboardTimeline = dashboardPlan ? loadPlanTimeline(dashboardPlan.id) : null
  const dashboardBlockers = dashboardPlan ? loadPlanBlockers(dashboardPlan.id) : []
  const sortedBlockers = sortBlockers(dashboardBlockers)
  const topBlockers = sortedBlockers.slice(0, 3)
  const unresolvedBlockerCount = sortedBlockers.filter(b => b.status !== 'resolved').length
  const timelineRows: Array<{ key: 'devStart' | 'testStart' | 'package'; label: string }> = [
    { key: 'devStart', label: '开发完成' },
    { key: 'testStart', label: '测试完成' },
    { key: 'package', label: '出包结束' },
  ]
  const upgradeWindowDelay = getDelayDays(
    dashboardTimeline?.upgradeWindow?.plannedEnd,
    dashboardTimeline?.upgradeWindow?.actualEnd
  )

  const currentVersionLineData = selectedVersionLine ? {
    upgradingPlan,
    progress: getUpgradeProgress(selectedVersionLine, upgradingPlan?.version),
    draftPlans: getPlansByStatus(selectedVersionLine, 'draft'),
    testingPlans: getPlansByStatus(selectedVersionLine, 'testing'),
    releasedPlans: getPlansByStatus(selectedVersionLine, 'released'),
    stats: getStats(selectedVersionLine),
  } : null

  const upgradingTargetVersion = currentVersionLineData?.upgradingPlan ?? null

  const getProgressPercent = (ready: number, total: number) => {
    if (!total) return 0
    return Math.round((ready / total) * 100)
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">仪表盘</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            版本发布全局视图{selectedVersionLine && <span className="font-mono"> · {selectedVersionLine}.x</span>}
          </p>
        </div>
        {/* 版本线选择器在右边 */}
        {versionLines.length > 0 && (
          <Select
            value={selectedVersionLine}
            onValueChange={(value) => {
              setSelectedVersionLine(value)
              updateURL(value)
            }}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {versionLines
                .sort((a, b) => {
                  const [aMajor, aMinor] = a.versionLine.split('.').map(Number)
                  const [bMajor, bMinor] = b.versionLine.split('.').map(Number)
                  if (aMajor !== bMajor) return bMajor - aMajor
                  return bMinor - aMinor
                })
                .map((vl) => (
                <SelectItem key={vl.versionLine} value={vl.versionLine}>
                  <span className="font-mono">{vl.versionLine}.x</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {versionLines.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-12 text-center text-muted-foreground">
            暂无活跃版本线，请在系统设置中配置
          </CardContent>
        </Card>
      ) : currentVersionLineData && (
        <>
          {/* 统计卡片 */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{currentVersionLineData.stats.totalPlans}</p>
                    <p className="text-xs text-muted-foreground">发布计划总数</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-secondary/10">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{currentVersionLineData.stats.upgradingCount}</p>
                    <p className="text-xs text-muted-foreground">升级中</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-success/10">
                    <Package className="h-5 w-5 text-success" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{currentVersionLineData.stats.upgradedRegions}</p>
                    <p className="text-xs text-muted-foreground">已升级局点</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 当前升级中 */}
          {upgradingTargetVersion && (
            <Link href={`/plans/${upgradingTargetVersion.id}`} className="block">
              <Card className="glass cursor-pointer hover:border-primary/50 transition-all">
                <CardContent className="pt-4">
                  <div className="flex items-center gap-2 mb-4">
                    <Rocket className="h-4 w-4 text-primary" />
                    <span className="font-medium">当前升级中</span>
                  </div>

                  <div className="flex gap-4">
                    {/* 版本信息 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xl font-bold font-mono text-primary">
                          {upgradingTargetVersion.version}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {upgradingTargetVersion.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {upgradingTargetVersion.summary}
                      </p>
                    </div>

                    {/* 升级进度 */}
                    {currentVersionLineData.progress && (
                      <div className="flex-1">
                        <div className="space-y-4">
                          {/* 后端进度 */}
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>后端</span>
                              <span className="text-muted-foreground">
                                {currentVersionLineData.progress.backend.ready} / {currentVersionLineData.progress.backend.total}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-primary transition-all"
                                  style={{ width: `${getProgressPercent(currentVersionLineData.progress.backend.ready, currentVersionLineData.progress.backend.total)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8 text-right">
                                {getProgressPercent(currentVersionLineData.progress.backend.ready, currentVersionLineData.progress.backend.total)}%
                              </span>
                            </div>
                          </div>

                          {/* 前端进度 */}
                          <div>
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span>前端</span>
                              <span className="text-muted-foreground">
                                {currentVersionLineData.progress.frontend.ready} / {currentVersionLineData.progress.frontend.total}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-secondary transition-all"
                                  style={{ width: `${getProgressPercent(currentVersionLineData.progress.frontend.ready, currentVersionLineData.progress.frontend.total)}%` }}
                                />
                              </div>
                              <span className="text-xs text-muted-foreground w-8 text-right">
                                {getProgressPercent(currentVersionLineData.progress.frontend.ready, currentVersionLineData.progress.frontend.total)}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          )}

          {/* 计划时间 / 阻塞问题 */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarClock className="h-4 w-4 text-primary" />
                    <span className="font-medium">计划时间 / 升级窗口</span>
                  </div>
                  {dashboardPlan && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono text-foreground">{dashboardPlan.version}</span>
                      <Badge variant="outline" className="text-[10px]">
                        {dashboardPlan.type}
                      </Badge>
                    </div>
                  )}
                </div>

                {dashboardPlan ? (
                  <div className="space-y-3 text-xs">
                    {timelineRows.map((row) => {
                      const milestone = dashboardTimeline?.[row.key]
                      const delayDays = getDelayDays(milestone?.planned, milestone?.actual)
                      const isDelayed = typeof delayDays === 'number' && delayDays > 0
                      const actualLabel = milestone?.actual ? formatDate(milestone.actual) : ''
                      return (
                        <div key={row.key} className="flex items-center justify-between gap-3">
                          <span className="text-muted-foreground w-20">{row.label}</span>
                          <div className="flex-1 text-muted-foreground">
                            计划 <span className="text-foreground">{formatDate(milestone?.planned)}</span>
                            {actualLabel && (
                              <>
                                <span className="mx-2 text-muted-foreground">/</span>
                                实际 <span className="text-foreground">{actualLabel}</span>
                              </>
                            )}
                          </div>
                          {isDelayed ? (
                            <Link href={`/plans/${dashboardPlan.id}`}>
                              <Badge variant="warning" className="text-[10px]">
                                延期 {delayDays} 天
                              </Badge>
                            </Link>
                          ) : (
                            <Badge variant="success" className="text-[10px]">
                              正常
                            </Badge>
                          )}
                        </div>
                      )
                    })}

                    <div className="flex items-center justify-between gap-3">
                      <span className="text-muted-foreground w-20">升级窗口</span>
                      <div className="flex-1 text-muted-foreground">
                        计划 <span className="text-foreground">{formatRange(dashboardTimeline?.upgradeWindow?.plannedStart, dashboardTimeline?.upgradeWindow?.plannedEnd)}</span>
                        {formatRangeOptional(dashboardTimeline?.upgradeWindow?.actualStart, dashboardTimeline?.upgradeWindow?.actualEnd) && (
                          <>
                            <span className="mx-2 text-muted-foreground">/</span>
                            实际 <span className="text-foreground">{formatRangeOptional(dashboardTimeline?.upgradeWindow?.actualStart, dashboardTimeline?.upgradeWindow?.actualEnd)}</span>
                          </>
                        )}
                      </div>
                      {upgradeWindowDelay ? (
                        <Link href={`/plans/${dashboardPlan.id}`}>
                          <Badge variant="warning" className="text-[10px]">
                            延期 {upgradeWindowDelay} 天
                          </Badge>
                        </Link>
                      ) : (
                        <Badge variant="success" className="text-[10px]">
                          正常
                        </Badge>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    暂无可展示计划
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-warning" />
                    <span className="font-medium">阻塞问题</span>
                  </div>
                  {dashboardPlan && (
                    <span className="text-xs text-muted-foreground">
                      未解决 {unresolvedBlockerCount}
                    </span>
                  )}
                </div>

                {dashboardPlan ? (
                  topBlockers.length > 0 ? (
                    <div className="space-y-2">
                      {topBlockers.map((blocker) => (
                        <div key={blocker.id} className="flex items-center justify-between gap-3 rounded-md bg-muted/40 px-3 py-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <Badge variant={getSeverityVariant(blocker.severity)} className="text-[10px]">
                              {blocker.severity || 'P3'}
                            </Badge>
                            <span className="text-sm truncate">{blocker.title}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Badge variant={getStatusVariant(blocker.status)} className="text-[10px]">
                              {getStatusLabel(blocker.status)}
                            </Badge>
                            {blocker.owner && (
                              <span>{blocker.owner}</span>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="text-xs text-muted-foreground mt-2">
                        共 {dashboardBlockers.length} 个阻塞
                      </div>
                    </div>
                  ) : (
                    <div className="py-6 text-center text-sm text-muted-foreground">
                      暂无阻塞问题
                    </div>
                  )
                ) : (
                  <div className="py-6 text-center text-sm text-muted-foreground">
                    暂无可展示计划
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* 版本进度 */}
          <Card className="glass">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 mb-4">
                <span className="font-medium">📋 版本进度</span>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {/* 开发中 */}
                <div>
                  <div className="text-sm font-medium mb-2 text-muted-foreground">开发中</div>
                  <div className="space-y-2">
                    {currentVersionLineData.draftPlans.length > 0 ? currentVersionLineData.draftPlans.map((plan) => (
                      <Link key={plan.id} href={`/plans/${plan.id}`}>
                        <Card className="hover:border-primary/50 transition-all cursor-pointer min-h-[88px]">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-sm font-bold text-primary">
                                {plan.version}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {plan.type}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2 line-clamp-1">
                              {plan.summary}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )) : (
                      <div className="min-h-[88px] flex items-center justify-center text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                        暂无
                      </div>
                    )}
                  </div>
                </div>

                {/* 测试中 */}
                <div>
                  <div className="text-sm font-medium mb-2 text-muted-foreground">测试中</div>
                  <div className="space-y-2">
                    {currentVersionLineData.testingPlans.length > 0 ? currentVersionLineData.testingPlans.map((plan) => (
                      <Link key={plan.id} href={`/plans/${plan.id}`}>
                        <Card className="hover:border-primary/50 transition-all cursor-pointer min-h-[88px]">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-sm font-bold text-primary">
                                {plan.version}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {plan.type}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2 line-clamp-1">
                              {plan.summary}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )) : (
                      <div className="min-h-[88px] flex items-center justify-center text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                        暂无
                      </div>
                    )}
                  </div>
                </div>

                {/* 研发出包 */}
                <div>
                  <div className="text-sm font-medium mb-2 text-muted-foreground">研发出包</div>
                  <div className="space-y-2">
                    {currentVersionLineData.releasedPlans.length > 0 ? currentVersionLineData.releasedPlans.map((plan) => (
                      <Link key={plan.id} href={`/plans/${plan.id}`}>
                        <Card className="hover:border-primary/50 transition-all cursor-pointer min-h-[88px]">
                          <CardContent className="p-3">
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono text-sm font-bold text-primary">
                                {plan.version}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {plan.type}
                              </Badge>
                            </div>
                            <div className="text-xs text-muted-foreground mb-2 line-clamp-1">
                              {plan.summary}
                            </div>
                          </CardContent>
                        </Card>
                      </Link>
                    )) : (
                      <div className="min-h-[88px] flex items-center justify-center text-center text-sm text-muted-foreground border border-dashed rounded-lg">
                        暂无
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
