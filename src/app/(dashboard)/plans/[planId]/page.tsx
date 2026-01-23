'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  ArrowLeft,
  Edit,
  Save,
  Package,
  CalendarClock,
  AlertTriangle,
  Plus,
  Trash2,
  ChevronDown,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { usePlan } from '@/hooks/useAPI'
import { useRegions } from '@/hooks/useAPI'

interface PlanDetail {
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

interface Component {
  name: string
  type: 'frontend' | 'backend'
  currentVersion: string
  targetVersion: string
  enabled: boolean
}

type TimelineKey = 'devStart' | 'testBetaT1' | 'testBetaT2' | 'testBetaT3Gamma' | 'package'
type DelayKey = TimelineKey | 'upgradeWindow'

interface PlanTimeline {
  devStart?: { planned?: string; actual?: string }
  testStart?: { planned?: string; actual?: string }
  testBetaT1?: { planned?: string; actual?: string }
  testBetaT2?: { planned?: string; actual?: string }
  testBetaT3Gamma?: { planned?: string; actual?: string }
  package?: { planned?: string; actual?: string }
  upgradeWindow?: {
    plannedStart?: string
    plannedEnd?: string
    actualStart?: string
    actualEnd?: string
  }
}

interface DelayReason {
  type: string
  reason: string
  owner?: string
  recordedAt?: string
}

interface BlockerItem {
  id: string
  title: string
  severity?: 'P0' | 'P1' | 'P2' | 'P3'
  status?: 'open' | 'in_progress' | 'resolved'
  owner?: string
  note?: string
  createdAt?: string
  updatedAt?: string
}

export default function PlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const planId = typeof params.planId === 'string' ? params.planId : Array.isArray(params.planId) ? params.planId[0] : ''
  const { plan, loading: planLoading, error: planError, fetchPlan } = usePlan(planId)
  const { regions } = useRegions()

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [componentDialogOpen, setComponentDialogOpen] = useState(false)

  // 编辑表单状态
  const [editSummary, setEditSummary] = useState('')
  const [editRequirements, setEditRequirements] = useState('')
  const [editBugs, setEditBugs] = useState('')
  const [editStatus, setEditStatus] = useState('')
  const [editType, setEditType] = useState('')

  // 组件编辑状态
  const [planComponents, setPlanComponents] = useState<Component[]>([])
  const [allComponents, setAllComponents] = useState<any[]>([])

  // 计划时间与延期原因
  const [timeline, setTimeline] = useState<PlanTimeline>({})
  const [delayReasons, setDelayReasons] = useState<Partial<Record<DelayKey, DelayReason>>>({})
  const [delayDialogOpen, setDelayDialogOpen] = useState(false)
  const [editingDelayKey, setEditingDelayKey] = useState<DelayKey | null>(null)
  const [delayForm, setDelayForm] = useState({ type: '需求变更', reason: '', owner: '' })
  const [timelineDirty, setTimelineDirty] = useState(false)
  const [timelineSavedAt, setTimelineSavedAt] = useState<string | null>(null)
  const [timelineExpanded, setTimelineExpanded] = useState(false)

  // 阻塞问题
  const [blockers, setBlockers] = useState<BlockerItem[]>([])
  const [blockerDialogOpen, setBlockerDialogOpen] = useState(false)
  const [editingBlockerId, setEditingBlockerId] = useState<string | null>(null)
  const [blockerForm, setBlockerForm] = useState<{
    title: string
    severity: 'P0' | 'P1' | 'P2' | 'P3'
    status: 'open' | 'in_progress' | 'resolved'
    owner: string
    note: string
  }>({
    title: '',
    severity: 'P1',
    status: 'open',
    owner: '',
    note: '',
  })

  function parseStored<T>(value: string | null, fallback: T): T {
    if (!value) return fallback
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }

  const getSampleTimeline = (planVersion: string): PlanTimeline | null => {
    if (planVersion !== '26.1.0') return null
    return {
      devStart: { planned: '2026-01-09', actual: '2026-01-09' },
      testStart: { planned: '2026-02-14', actual: '2026-02-14' },
      testBetaT3Gamma: { planned: '2026-02-14', actual: '2026-02-14' },
      package: { planned: '2026-02-28', actual: '2026-02-28' },
      upgradeWindow: {
        plannedStart: '2026-02-27',
        plannedEnd: '2026-04-30',
        actualStart: '2026-02-27',
        actualEnd: '2026-04-30',
      },
    }
  }

  const normalizeTimeline = (value: PlanTimeline): PlanTimeline => {
    const next: PlanTimeline = { ...value }
    if (next.testBetaT3Gamma) {
      next.testStart = { ...next.testBetaT3Gamma }
    } else if (next.testStart) {
      next.testBetaT3Gamma = { ...next.testStart }
    }
    return next
  }

  useEffect(() => {
    if (plan) {
      setEditSummary(plan.summary || '')
      setEditStatus(plan.status || '')
      setEditType(plan.type || '')
      setTimelineExpanded(false)
      const reqs = Array.isArray(plan.relatedRequirements) ? plan.relatedRequirements : []
      const bugs = Array.isArray(plan.relatedBugs) ? plan.relatedBugs : []
      setEditRequirements(reqs.join(', '))
      setEditBugs(bugs.join(', '))

      // 加载该计划的组件配置 - 优先使用数据库 API 返回的数据
      if (plan.components && Array.isArray(plan.components)) {
        setPlanComponents(plan.components)
      } else {
        // 如果 API 没有返回组件数据，尝试从 localStorage 读取（降级处理）
        const storedComponents = localStorage.getItem(`plan_components_${plan.id}`)
        if (storedComponents) {
          setPlanComponents(JSON.parse(storedComponents))
        } else {
          setPlanComponents([])
        }
      }

      const storedTimeline = localStorage.getItem(`plan_timeline_${plan.id}`)
      const parsedTimeline = parseStored<PlanTimeline>(storedTimeline, {})
      if (storedTimeline) {
        setTimeline(normalizeTimeline(parsedTimeline))
        setTimelineDirty(false)
      } else {
        const sampleTimeline = getSampleTimeline(plan.version)
        if (sampleTimeline) {
          setTimeline(normalizeTimeline(sampleTimeline))
          setTimelineDirty(true)
        } else {
          setTimeline({})
          setTimelineDirty(false)
        }
      }
      setTimelineSavedAt(null)

      const storedDelayReasons = localStorage.getItem(`plan_delay_reasons_${plan.id}`)
      setDelayReasons(parseStored<Partial<Record<DelayKey, DelayReason>>>(storedDelayReasons, {}))

      const storedBlockers = localStorage.getItem(`plan_blockers_${plan.id}`)
      setBlockers(parseStored<BlockerItem[]>(storedBlockers, []))
    }
  }, [plan])

  // 加载系统组件库（从数据库 API）
  useEffect(() => {
    const fetchAllComponents = async () => {
      try {
        const res = await fetch('/api/components')
        const json = await res.json()
        if (json.success) {
          setAllComponents(json.data)
        }
      } catch (error) {
        console.error('获取组件库失败:', error)
        // 如果 API 失败，尝试从 localStorage 读取（降级处理）
        const stored = localStorage.getItem('settings_components')
        if (stored) {
          setAllComponents(JSON.parse(stored))
        }
      }
    }
    fetchAllComponents()
  }, [])

  useEffect(() => {
    if (!plan || !timelineDirty) return
    localStorage.setItem(`plan_timeline_${plan.id}`, JSON.stringify(timeline))
    setTimelineSavedAt(new Date().toISOString())
    setTimelineDirty(false)
  }, [timeline, timelineDirty, plan])

  // 状态映射（新术语）
  const statusMap: Record<string, { label: string; variant: any }> = {
    draft: { label: '开发中', variant: 'draft' },
    testing: { label: '测试中', variant: 'testing' },
    released: { label: '研发出包', variant: 'released' },
    upgrading: { label: '升级中', variant: 'upgrading' },
    completed: { label: '已完成', variant: 'completed' },
  }

  const handleSavePlan = async () => {
    const reqArray = editRequirements.split(',').map(s => s.trim()).filter(Boolean)
    const bugArray = editBugs.split(',').map(s => s.trim()).filter(Boolean)

    try {
      const response = await fetch(`/api/plans/${plan!.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          summary: editSummary,
          relatedRequirements: reqArray,
          relatedBugs: bugArray,
        }),
      })

      const result = await response.json()
      if (result.success) {
        // 刷新数据
        await fetchPlan()
        setEditDialogOpen(false)
        toast({
          title: '保存成功',
          description: '计划信息已更新',
        })
      } else {
        throw new Error(result.error || '保存失败')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '保存失败',
        description: error instanceof Error ? error.message : '保存失败',
      })
    }
  }

  // 保存组件配置
  const handleSaveComponents = async () => {
    try {
      const response = await fetch(`/api/plans/${plan!.id}/components`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ components: planComponents }),
      })

      const result = await response.json()
      if (result.success) {
        // 刷新计划数据
        await fetchPlan()
        setComponentDialogOpen(false)
        toast({
          title: '保存成功',
          description: '组件信息已更新',
        })
      } else {
        throw new Error(result.error || '保存失败')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '保存失败',
        description: error instanceof Error ? error.message : '保存失败',
      })
    }
  }

  // 切换组件启用状态
  const toggleComponent = (componentName: string) => {
    const existing = planComponents.find(c => c.name === componentName)
    if (existing) {
      // 如果已启用，则禁用（删除）
      setPlanComponents(planComponents.filter(c => c.name !== componentName))
    } else {
      // 如果未启用，则添加（从组件库获取默认版本）
      const component = allComponents.find(c => c.name === componentName)
      if (component) {
        setPlanComponents([
          ...planComponents,
          {
            name: component.name,
            type: component.type,
            currentVersion: '1.0.0',
            targetVersion: '1.0.0',
            enabled: true,
          }
        ])
      }
    }
  }

  // 更新组件版本
  const updateComponentVersion = (componentName: string, field: 'currentVersion' | 'targetVersion', value: string) => {
    setPlanComponents(planComponents.map(c =>
      c.name === componentName ? { ...c, [field]: value } : c
    ))
  }

  // 判断组件是否启用
  const isComponentEnabled = (componentName: string) => {
    return planComponents.some(c => c.name === componentName)
  }

  // 获取组件配置
  const getComponentConfig = (componentName: string) => {
    return planComponents.find(c => c.name === componentName)
  }

  // 获取变更类型
  const getChangeType = (component: Component) => {
    if (component.currentVersion === component.targetVersion) return 'unchanged'
    return 'upgrade'
  }

  // 计算升级进度
  const getUpgradeProgress = () => {
    if (!plan || plan.status !== 'upgrading') return null

    const storedRegions = localStorage.getItem('settings_regions')
    if (!storedRegions) return null

    const allRegions = JSON.parse(storedRegions)
    const backendReady = allRegions.filter((r: any) => r.backendReady).length
    const frontendReady = allRegions.filter((r: any) => r.frontendReady).length
    const total = allRegions.length

    return {
      backend: { ready: backendReady, total },
      frontend: { ready: frontendReady, total },
    }
  }

  const progress = getUpgradeProgress()

  const requirements = plan ? (Array.isArray(plan.relatedRequirements) ? plan.relatedRequirements : []) : []
  const bugs = plan ? (Array.isArray(plan.relatedBugs) ? plan.relatedBugs : []) : []
  const unresolvedBlockerCount = blockers.filter((item) => item.status !== 'resolved').length

  const getProgressPercent = (ready: number, total: number) => {
    if (!total) return 0
    return Math.round((ready / total) * 100)
  }

  const milestoneRows: Array<{ key: TimelineKey; label: string }> = [
    { key: 'devStart', label: '开发完成' },
    { key: 'testBetaT1', label: 'Beta_T1完成' },
    { key: 'testBetaT2', label: 'Beta_T2完成' },
    { key: 'testBetaT3Gamma', label: 'Beta_T3+Gamma完成' },
    { key: 'package', label: '出包结束' },
  ]

  const milestoneLabels: Record<DelayKey, string> = {
    devStart: '开发完成',
    testBetaT1: 'Beta_T1完成',
    testBetaT2: 'Beta_T2完成',
    testBetaT3Gamma: 'Beta_T3+Gamma完成',
    package: '出包结束',
    upgradeWindow: '升级窗口',
  }

  const delayReasonTypes = [
    '需求变更',
    '资源不足',
    '外部依赖',
    '质量问题',
    '环境问题',
    '其他',
  ]

  const parseDate = (value?: string) => {
    if (!value) return null
    const [year, month, day] = value.split('-').map(Number)
    if (!year || !month || !day) return null
    const date = new Date(year, month - 1, day)
    date.setHours(0, 0, 0, 0)
    return date
  }

  const getScheduleStatus = (planned?: string, actual?: string): {
    label: string
    variant: 'secondary' | 'destructive' | 'success' | 'warning' | 'default' | 'outline'
    isDelayed: boolean
  } => {
    const plannedDate = parseDate(planned)
    if (!plannedDate) {
      if (actual) {
        return { label: '已完成', variant: 'success', isDelayed: false }
      }
      return { label: '未设置', variant: 'outline', isDelayed: false }
    }
    const actualDate = actual ? parseDate(actual) : null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const compareDate = actualDate ?? today
    const diff = compareDate.getTime() - plannedDate.getTime()
    const days = Math.ceil(Math.abs(diff) / (24 * 60 * 60 * 1000))

    if (!actualDate) {
      if (diff > 0) {
        return { label: `延期 ${days} 天`, variant: 'warning', isDelayed: true }
      }
      return { label: '未到期', variant: 'outline', isDelayed: false }
    }

    if (diff > 0) {
      return { label: `延期 ${days} 天`, variant: 'warning', isDelayed: true }
    }
    if (diff < 0) {
      return { label: `提前 ${days} 天`, variant: 'success', isDelayed: false }
    }
    return { label: '准时', variant: 'success', isDelayed: false }
  }

  const formatRecordDate = (value?: string) => {
    if (!value) return ''
    return value.split('T')[0]
  }

  const getChartDates = () => {
    const values = [
      timeline.devStart?.planned,
      timeline.devStart?.actual,
      timeline.testBetaT1?.planned,
      timeline.testBetaT1?.actual,
      timeline.testBetaT2?.planned,
      timeline.testBetaT2?.actual,
      timeline.testBetaT3Gamma?.planned,
      timeline.testBetaT3Gamma?.actual,
      timeline.testStart?.planned,
      timeline.testStart?.actual,
      timeline.package?.planned,
      timeline.package?.actual,
      timeline.upgradeWindow?.plannedStart,
      timeline.upgradeWindow?.plannedEnd,
      timeline.upgradeWindow?.actualStart,
      timeline.upgradeWindow?.actualEnd,
    ]
    return values.map(parseDate).filter((value): value is Date => Boolean(value))
  }

  const buildChartRange = () => {
    const dates = getChartDates()
    if (dates.length === 0) return null
    const minTime = Math.min(...dates.map((date) => date.getTime()))
    const maxTime = Math.max(...dates.map((date) => date.getTime()))
    const start = new Date(minTime)
    const end = new Date(maxTime)
    if (start.getTime() === end.getTime()) {
      end.setDate(end.getDate() + 7)
    }
    start.setDate(start.getDate() - 3)
    end.setDate(end.getDate() + 3)
    const rangeMs = Math.max(1, end.getTime() - start.getTime())
    return { start, end, rangeMs }
  }

  const chartRange = buildChartRange()
  const getPercent = (date: Date) => {
    if (!chartRange) return 0
    const raw = ((date.getTime() - chartRange.start.getTime()) / chartRange.rangeMs) * 100
    return Math.min(100, Math.max(0, raw))
  }
  const completionDateStrings = milestoneRows
    .map((row) => timeline[row.key]?.actual || timeline[row.key]?.planned)
    .filter((value): value is string => Boolean(value))
  const upgradeCompletion = timeline.upgradeWindow?.actualEnd || timeline.upgradeWindow?.plannedEnd
  if (upgradeCompletion) {
    completionDateStrings.push(upgradeCompletion)
  }
  const completionDates = Array.from(new Set(completionDateStrings))
    .map(parseDate)
    .filter((value): value is Date => Boolean(value))
    .sort((a, b) => a.getTime() - b.getTime())
  const completionTicks = chartRange
    ? (() => {
      if (completionDates.length === 0) return []
      const minGapPercent = Math.min(10, 100 / Math.max(1, completionDates.length - 1))
      let lastLabelPercent = -Infinity
      const ticks = completionDates.map((date) => {
        const percent = getPercent(date)
        const labelPercent = Math.max(percent, lastLabelPercent + minGapPercent)
        lastLabelPercent = labelPercent
        return { date, percent, labelPercent }
      })
      const overflow = ticks[ticks.length - 1].labelPercent - 100
      if (overflow > 0) {
        ticks.forEach((tick) => {
          tick.labelPercent = tick.labelPercent - overflow
        })
      }
      return ticks
    })()
    : []

  const formatTickLabel = (date: Date) => {
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    return `${month}-${day}`
  }

  const formatDateLabel = (value?: string) => {
    const date = parseDate(value)
    if (!date) return '--'
    return formatTickLabel(date)
  }

  const updateTimelineField = (key: TimelineKey, field: 'planned' | 'actual', value: string) => {
    setTimeline((prev) => {
      const next: PlanTimeline = {
        ...prev,
        [key]: {
          ...(prev[key] || {}),
          [field]: value,
        },
      }
      if (key === 'testBetaT3Gamma') {
        next.testStart = { ...(next.testBetaT3Gamma || {}) }
      }
      return next
    })
    setTimelineDirty(true)
  }

  const updateUpgradeWindowField = (field: 'plannedStart' | 'plannedEnd' | 'actualStart' | 'actualEnd', value: string) => {
    setTimeline((prev) => ({
      ...prev,
      upgradeWindow: {
        ...(prev.upgradeWindow || {}),
        [field]: value,
      },
    }))
    setTimelineDirty(true)
  }

  const handleSaveTimeline = () => {
    if (!plan) return
    localStorage.setItem(`plan_timeline_${plan.id}`, JSON.stringify(timeline))
    setTimelineDirty(false)
    setTimelineSavedAt(new Date().toISOString())
    toast({
      title: '保存成功',
      description: '计划时间已更新',
    })
  }

  const openDelayDialog = (key: DelayKey) => {
    const existing = delayReasons[key]
    setDelayForm({
      type: existing?.type || '需求变更',
      reason: existing?.reason || '',
      owner: existing?.owner || '',
    })
    setEditingDelayKey(key)
    setDelayDialogOpen(true)
  }

  const handleSaveDelayReason = () => {
    if (!plan || !editingDelayKey) return
    if (!delayForm.reason.trim()) {
      toast({
        variant: 'destructive',
        title: '请填写延期原因',
      })
      return
    }
    const next = {
      ...delayReasons,
      [editingDelayKey]: {
        ...(delayReasons[editingDelayKey] || {}),
        ...delayForm,
        recordedAt: new Date().toISOString(),
      },
    }
    setDelayReasons(next)
    localStorage.setItem(`plan_delay_reasons_${plan.id}`, JSON.stringify(next))
    setDelayDialogOpen(false)
    toast({
      title: '保存成功',
      description: '延期原因已更新',
    })
  }

  const saveBlockers = (next: BlockerItem[]) => {
    setBlockers(next)
    if (!plan) return
    localStorage.setItem(`plan_blockers_${plan.id}`, JSON.stringify(next))
  }

  const openNewBlockerDialog = () => {
    setEditingBlockerId(null)
    setBlockerForm({
      title: '',
      severity: 'P1',
      status: 'open',
      owner: '',
      note: '',
    })
    setBlockerDialogOpen(true)
  }

  const openEditBlockerDialog = (blocker: BlockerItem) => {
    setEditingBlockerId(blocker.id)
    setBlockerForm({
      title: blocker.title || '',
      severity: blocker.severity || 'P1',
      status: blocker.status || 'open',
      owner: blocker.owner || '',
      note: blocker.note || '',
    })
    setBlockerDialogOpen(true)
  }

  const handleSaveBlocker = () => {
    if (!plan) return
    if (!blockerForm.title.trim()) {
      toast({
        variant: 'destructive',
        title: '请填写阻塞标题',
      })
      return
    }
    const now = new Date().toISOString()
    let next: BlockerItem[] = []
    if (editingBlockerId) {
      next = blockers.map((item) =>
        item.id === editingBlockerId
          ? {
            ...item,
            ...blockerForm,
            updatedAt: now,
          }
          : item
      )
    } else {
      next = [
        ...blockers,
        {
          id: Date.now().toString(),
          ...blockerForm,
          createdAt: now,
          updatedAt: now,
        },
      ]
    }
    saveBlockers(next)
    setBlockerDialogOpen(false)
    toast({
      title: '保存成功',
      description: '阻塞问题已更新',
    })
  }

  const handleDeleteBlocker = (id: string) => {
    const next = blockers.filter((item) => item.id !== id)
    saveBlockers(next)
    toast({
      title: '已删除',
      description: '阻塞问题已移除',
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

  if (planLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (planError || !plan) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">{planError || '计划不存在'}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-mono text-primary">
              {plan.version}
            </h1>
            <Badge variant={statusMap[plan.status]?.variant || 'outline'}>
              {statusMap[plan.status]?.label || plan.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{plan.summary}</p>
        </div>
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">
              <Edit className="h-4 w-4 mr-2" />
              编辑
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>编辑发布计划</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>状态</Label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">开发中</SelectItem>
                    <SelectItem value="testing">测试中</SelectItem>
                    <SelectItem value="released">研发出包</SelectItem>
                    <SelectItem value="upgrading">升级中</SelectItem>
                    <SelectItem value="completed">已完成</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>类型</Label>
                <Select value={editType} onValueChange={setEditType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Feature Release">Feature Release</SelectItem>
                    <SelectItem value="Update Release">Update Release</SelectItem>
                    <SelectItem value="Patch">Patch</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>版本摘要</Label>
              <Textarea
                value={editSummary}
                onChange={(e) => setEditSummary(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>关联需求（逗号分隔）</Label>
              <Input
                value={editRequirements}
                onChange={(e) => setEditRequirements(e.target.value)}
                placeholder="REQ-001, REQ-002"
              />
            </div>
            <div className="space-y-2">
              <Label>关联缺陷（逗号分隔）</Label>
              <Input
                value={editBugs}
                onChange={(e) => setEditBugs(e.target.value)}
                placeholder="BUG-001, BUG-002"
              />
            </div>
          </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleSavePlan}>
                <Save className="h-4 w-4 mr-2" />
                保存
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* 计划时间 / 里程碑 */}
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarClock className="h-4 w-4" />
              计划时间 / 里程碑
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">结束日期（到日）</p>
          </div>
          <Button variant="outline" size="sm" onClick={handleSaveTimeline}>
            <Save className="h-4 w-4 mr-2" />
            保存时间
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {chartRange ? (
            <div className="space-y-4">
              <div className="grid gap-3 md:grid-cols-[110px_1fr_auto] items-center text-xs text-muted-foreground">
                <span />
                <div className="relative h-5">
                  {completionTicks.map((tick) => (
                    <div
                      key={`line-${tick.date.toISOString()}`}
                      className="absolute top-0 -translate-x-1/2"
                      style={{ left: `${tick.percent}%` }}
                    >
                      <div className="h-2 w-px bg-border/70 mx-auto mb-1" />
                    </div>
                  ))}
                  {completionTicks.map((tick) => (
                    <div
                      key={`label-${tick.date.toISOString()}`}
                      className="absolute top-0 -translate-x-1/2"
                      style={{ left: `${tick.labelPercent}%` }}
                    >
                      <span className="block whitespace-nowrap">{formatTickLabel(tick.date)}</span>
                    </div>
                  ))}
                </div>
                <span className="text-right">状态</span>
              </div>

              <div className="space-y-3">
                {milestoneRows.map((row) => {
                  const milestone = timeline[row.key] || {}
                  const plannedDate = milestone.planned ? parseDate(milestone.planned) : null
                  const actualDate = milestone.actual ? parseDate(milestone.actual) : null
                  const status = getScheduleStatus(milestone.planned, milestone.actual)
                  const showReasonAction = status.isDelayed
                  const plannedPercent = plannedDate ? getPercent(plannedDate) : null
                  const actualPercent = actualDate ? getPercent(actualDate) : null
                  const isSamePoint = plannedDate && actualDate && plannedDate.getTime() === actualDate.getTime()
                  const segmentStart = plannedPercent !== null && actualPercent !== null
                    ? Math.min(plannedPercent, actualPercent)
                    : null
                  const segmentWidth = plannedPercent !== null && actualPercent !== null
                    ? Math.abs(actualPercent - plannedPercent)
                    : null
                  const segmentColor = plannedDate && actualDate && actualDate > plannedDate
                    ? 'bg-destructive'
                    : 'bg-success'
                  return (
                    <div key={row.key} className="grid gap-3 md:grid-cols-[110px_1fr_auto] items-center">
                      <div className="text-sm text-muted-foreground">{row.label}</div>
                      <div className="relative h-6">
                        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border/70" />
                        {segmentStart !== null && segmentWidth !== null && segmentWidth > 0 && (
                          <div
                            className={`absolute top-1/2 h-0.5 -translate-y-1/2 ${segmentColor}`}
                            style={{ left: `${segmentStart}%`, width: `${segmentWidth}%` }}
                          />
                        )}
                        {plannedPercent !== null && !isSamePoint && (
                          <div
                            className="absolute top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-primary bg-card"
                            style={{ left: `${plannedPercent}%` }}
                          />
                        )}
                        {actualPercent !== null && (
                          <div
                            className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary shadow-glow-sm"
                            style={{ left: `${actualPercent}%` }}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <Badge variant={status.variant} className="text-[10px]">
                          {status.label}
                        </Badge>
                        {showReasonAction && (
                          <Button variant="ghost" size="sm" onClick={() => openDelayDialog(row.key)}>
                            原因
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}

                {(() => {
                  const plannedStart = timeline.upgradeWindow?.plannedStart
                  const plannedEnd = timeline.upgradeWindow?.plannedEnd
                  const actualStart = timeline.upgradeWindow?.actualStart
                  const actualEnd = timeline.upgradeWindow?.actualEnd
                  const plannedStartDate = plannedStart ? parseDate(plannedStart) : null
                  const plannedEndDate = plannedEnd ? parseDate(plannedEnd) : null
                  const actualStartDate = actualStart ? parseDate(actualStart) : null
                  const actualEndDate = actualEnd ? parseDate(actualEnd) : null
                  const status = getScheduleStatus(plannedEnd, actualEnd)
                  const showReasonAction = status.isDelayed
                  const plannedStartPercent = plannedStartDate ? getPercent(plannedStartDate) : null
                  const plannedEndPercent = plannedEndDate ? getPercent(plannedEndDate) : null
                  const actualStartPercent = actualStartDate ? getPercent(actualStartDate) : null
                  const actualEndPercent = actualEndDate ? getPercent(actualEndDate) : null
                  const plannedLeft = plannedStartPercent !== null && plannedEndPercent !== null
                    ? Math.min(plannedStartPercent, plannedEndPercent)
                    : null
                  const plannedWidth = plannedStartPercent !== null && plannedEndPercent !== null
                    ? Math.abs(plannedEndPercent - plannedStartPercent)
                    : null
                  const actualLeft = actualStartPercent !== null && actualEndPercent !== null
                    ? Math.min(actualStartPercent, actualEndPercent)
                    : null
                  const actualWidth = actualStartPercent !== null && actualEndPercent !== null
                    ? Math.abs(actualEndPercent - actualStartPercent)
                    : null
                  const delaySegmentStart = plannedEndPercent !== null && actualEndPercent !== null
                    ? Math.min(plannedEndPercent, actualEndPercent)
                    : null
                  const delaySegmentWidth = plannedEndPercent !== null && actualEndPercent !== null
                    ? Math.abs(actualEndPercent - plannedEndPercent)
                    : null
                  const delaySegmentColor = plannedEndDate && actualEndDate && actualEndDate > plannedEndDate
                    ? 'bg-destructive'
                    : 'bg-success'
                  return (
                    <div className="grid gap-3 md:grid-cols-[110px_1fr_auto] items-center">
                      <div className="text-sm text-muted-foreground">
                        升级窗口
                      </div>
                      <div className="relative h-6">
                        <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-border/70" />
                        {plannedLeft !== null && plannedWidth !== null && plannedWidth > 0 && (
                          <div
                            className="absolute top-1/2 h-2 -translate-y-1/2 rounded-full bg-primary/30"
                            style={{ left: `${plannedLeft}%`, width: `${plannedWidth}%` }}
                          />
                        )}
                        {actualLeft !== null && actualWidth !== null && actualWidth > 0 && (
                          <div
                            className="absolute top-1/2 h-3 -translate-y-1/2 rounded-full bg-primary/70"
                            style={{ left: `${actualLeft}%`, width: `${actualWidth}%` }}
                          />
                        )}
                        {delaySegmentStart !== null && delaySegmentWidth !== null && delaySegmentWidth > 0 && (
                          <div
                            className={`absolute top-1/2 h-0.5 -translate-y-1/2 ${delaySegmentColor}`}
                            style={{ left: `${delaySegmentStart}%`, width: `${delaySegmentWidth}%` }}
                          />
                        )}
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <Badge variant={status.variant} className="text-[10px]">
                          {status.label}
                        </Badge>
                      {showReasonAction && (
                        <Button variant="ghost" size="sm" onClick={() => openDelayDialog('upgradeWindow')}>
                          原因
                        </Button>
                      )}
                      </div>
                    </div>
                  )
                })()}
              </div>

              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full border border-primary" />
                    计划
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-primary" />
                    实际
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-0.5 w-6 bg-destructive" />
                    延期
                  </span>
                </div>
                <span>修改后自动保存</span>
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">暂无时间数据</div>
          )}

          <div className="flex items-center justify-between">
            <div className="text-xs text-muted-foreground">
              {timelineSavedAt ? `已保存 ${formatRecordDate(timelineSavedAt)}` : '时间可编辑'}
            </div>
            <Button variant="ghost" size="sm" onClick={() => setTimelineExpanded((prev) => !prev)}>
              {timelineExpanded ? '收起编辑' : '编辑时间'}
              <ChevronDown className={`h-4 w-4 ml-1 transition-transform ${timelineExpanded ? 'rotate-180' : ''}`} />
            </Button>
          </div>

          {timelineExpanded && (
            <div className="space-y-4">
              {milestoneRows.map((row) => {
                const milestone = timeline[row.key] || {}
                const status = getScheduleStatus(milestone.planned, milestone.actual)
                const reason = delayReasons[row.key]
                const showReasonAction = status.isDelayed
                return (
                  <div key={row.key} className="rounded-lg border border-border/40 p-3 space-y-2">
                    <div className="grid gap-3 md:grid-cols-[110px_1fr_1fr_auto] items-center">
                      <div className="text-sm text-muted-foreground">{row.label}</div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">计划</Label>
                        <Input
                          type="date"
                          value={milestone.planned || ''}
                          onChange={(e) => updateTimelineField(row.key, 'planned', e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">实际</Label>
                        <Input
                          type="date"
                          value={milestone.actual || ''}
                          onChange={(e) => updateTimelineField(row.key, 'actual', e.target.value)}
                        />
                      </div>
                      <div className="flex items-center gap-2 md:justify-end">
                        <Badge variant={status.variant} className="text-[10px]">
                          {status.label}
                        </Badge>
                        {showReasonAction && (
                          <Button variant="ghost" size="sm" onClick={() => openDelayDialog(row.key)}>
                            原因
                          </Button>
                        )}
                      </div>
                    </div>
                    {status.isDelayed && reason?.reason && (
                      <div className="text-xs text-muted-foreground">
                        原因：{reason.type ? `${reason.type} · ` : ''}{reason.reason}
                        {reason.owner ? ` · ${reason.owner}` : ''}
                        {reason.recordedAt ? ` · ${formatRecordDate(reason.recordedAt)}` : ''}
                      </div>
                    )}
                  </div>
                )
              })}

              <div className="rounded-lg border border-border/40 p-3 space-y-2">
                <div className="grid gap-3 md:grid-cols-[110px_1fr_1fr_auto] items-center">
                  <div className="text-sm text-muted-foreground">升级窗口</div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">计划</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={timeline.upgradeWindow?.plannedStart || ''}
                        onChange={(e) => updateUpgradeWindowField('plannedStart', e.target.value)}
                      />
                      <span className="text-muted-foreground">~</span>
                      <Input
                        type="date"
                        value={timeline.upgradeWindow?.plannedEnd || ''}
                        onChange={(e) => updateUpgradeWindowField('plannedEnd', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">实际</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="date"
                        value={timeline.upgradeWindow?.actualStart || ''}
                        onChange={(e) => updateUpgradeWindowField('actualStart', e.target.value)}
                      />
                      <span className="text-muted-foreground">~</span>
                      <Input
                        type="date"
                        value={timeline.upgradeWindow?.actualEnd || ''}
                        onChange={(e) => updateUpgradeWindowField('actualEnd', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2 md:justify-end">
                    {(() => {
                      const status = getScheduleStatus(timeline.upgradeWindow?.plannedEnd, timeline.upgradeWindow?.actualEnd)
                      const reason = delayReasons.upgradeWindow
                      const showReasonAction = status.isDelayed
                      return (
                        <>
                          <Badge variant={status.variant} className="text-[10px]">
                            {status.label}
                          </Badge>
                          {showReasonAction && (
                            <Button variant="ghost" size="sm" onClick={() => openDelayDialog('upgradeWindow')}>
                              原因
                            </Button>
                          )}
                        </>
                      )
                    })()}
                  </div>
                </div>
                {getScheduleStatus(timeline.upgradeWindow?.plannedEnd, timeline.upgradeWindow?.actualEnd).isDelayed && delayReasons.upgradeWindow?.reason && (
                  <div className="text-xs text-muted-foreground">
                    原因：{delayReasons.upgradeWindow.type ? `${delayReasons.upgradeWindow.type} · ` : ''}{delayReasons.upgradeWindow.reason}
                    {delayReasons.upgradeWindow.owner ? ` · ${delayReasons.upgradeWindow.owner}` : ''}
                    {delayReasons.upgradeWindow.recordedAt ? ` · ${formatRecordDate(delayReasons.upgradeWindow.recordedAt)}` : ''}
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 阻塞问题 */}
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" />
              阻塞问题
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">未解决 {unresolvedBlockerCount} 个</p>
          </div>
          <Button variant="outline" size="sm" onClick={openNewBlockerDialog}>
            <Plus className="h-4 w-4 mr-2" />
            新增阻塞
          </Button>
        </CardHeader>
        <CardContent>
          {blockers.length > 0 ? (
            <div className="space-y-2">
              {blockers.map((blocker) => (
                <div key={blocker.id} className="rounded-lg border border-border/40 p-3 space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2 min-w-0">
                      <Badge variant={getSeverityVariant(blocker.severity)} className="text-[10px]">
                        {blocker.severity || 'P3'}
                      </Badge>
                      <span className="text-sm truncate">{blocker.title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(blocker.status)} className="text-[10px]">
                        {getStatusLabel(blocker.status)}
                      </Badge>
                      {blocker.owner && (
                        <span className="text-xs text-muted-foreground">{blocker.owner}</span>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => openEditBlockerDialog(blocker)}>
                        编辑
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                        onClick={() => handleDeleteBlocker(blocker.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        删除
                      </Button>
                    </div>
                  </div>
                  {blocker.note && (
                    <div className="text-xs text-muted-foreground pl-6">
                      {blocker.note}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-muted-foreground">
              暂无阻塞问题
            </div>
          )}
        </CardContent>
      </Card>

      {/* 升级进度 */}
      {progress && (
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <span className="font-medium">升级进度</span>
              <Button variant="outline" size="sm" onClick={() => router.push('/regions')}>
                查看局点详情 →
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>后端</span>
                  <span className="text-muted-foreground">{progress.backend.ready} / {progress.backend.total}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${getProgressPercent(progress.backend.ready, progress.backend.total)}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span>前端</span>
                  <span className="text-muted-foreground">{progress.frontend.ready} / {progress.frontend.total}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary transition-all"
                    style={{ width: `${getProgressPercent(progress.frontend.ready, progress.frontend.total)}%` }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 关联信息 */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="glass">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-2">关联需求</div>
            {requirements.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {requirements.map((req: string) => (
                  <Badge key={req} variant="outline" className="text-xs">
                    {req}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">暂无</span>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground mb-2">关联缺陷</div>
            {bugs.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {bugs.map((bug: string) => (
                  <Badge key={bug} variant="destructive" className="text-xs">
                    {bug}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">暂无</span>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 组件信息 */}
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              组件信息
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-0.5">
              前端和后端组件版本 ({planComponents.length} 个组件)
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setComponentDialogOpen(true)}>
            <Edit className="h-4 w-4 mr-2" />
            编辑组件
          </Button>
        </CardHeader>
        <CardContent>
          {planComponents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              暂未配置组件信息，点击&ldquo;编辑组件&rdquo;添加
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>组件名称</TableHead>
                  <TableHead>当前版本</TableHead>
                  <TableHead>目标版本</TableHead>
                  <TableHead>变更</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {planComponents.map((component) => {
                  const changeType = getChangeType(component)
                  return (
                    <TableRow key={component.name}>
                      <TableCell className="font-mono text-sm">{component.name}</TableCell>
                      <TableCell className="font-mono text-sm text-muted-foreground">{component.currentVersion}</TableCell>
                      <TableCell className="font-mono text-sm text-primary">{component.targetVersion}</TableCell>
                      <TableCell>
                        <Badge
                          variant={changeType === 'upgrade' ? 'success' : 'outline'}
                          className="text-xs"
                        >
                          {changeType === 'upgrade' ? '升级' : '不变'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 延期原因弹窗 */}
      <Dialog
        open={delayDialogOpen}
        onOpenChange={(open) => {
          setDelayDialogOpen(open)
          if (!open) {
            setEditingDelayKey(null)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              延期原因{editingDelayKey ? ` - ${milestoneLabels[editingDelayKey]}` : ''}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>原因类型</Label>
              <Select
                value={delayForm.type}
                onValueChange={(value) => setDelayForm((prev) => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {delayReasonTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>原因说明</Label>
              <Textarea
                value={delayForm.reason}
                onChange={(e) => setDelayForm((prev) => ({ ...prev, reason: e.target.value }))}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>责任人</Label>
              <Input
                value={delayForm.owner}
                onChange={(e) => setDelayForm((prev) => ({ ...prev, owner: e.target.value }))}
                placeholder="可选"
              />
            </div>
            {editingDelayKey && delayReasons[editingDelayKey]?.recordedAt && (
              <div className="text-xs text-muted-foreground">
                最近记录：{formatRecordDate(delayReasons[editingDelayKey]?.recordedAt)}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDelayDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveDelayReason}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 阻塞问题弹窗 */}
      <Dialog
        open={blockerDialogOpen}
        onOpenChange={(open) => {
          setBlockerDialogOpen(open)
          if (!open) {
            setEditingBlockerId(null)
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingBlockerId ? '编辑阻塞问题' : '新增阻塞问题'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>标题</Label>
              <Input
                value={blockerForm.title}
                onChange={(e) => setBlockerForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="阻塞问题简述"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>级别</Label>
                <Select
                  value={blockerForm.severity}
                  onValueChange={(value) => setBlockerForm((prev) => ({ ...prev, severity: value as 'P0' | 'P1' | 'P2' | 'P3' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="P0">P0</SelectItem>
                    <SelectItem value="P1">P1</SelectItem>
                    <SelectItem value="P2">P2</SelectItem>
                    <SelectItem value="P3">P3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>状态</Label>
                <Select
                  value={blockerForm.status}
                  onValueChange={(value) => setBlockerForm((prev) => ({ ...prev, status: value as 'open' | 'in_progress' | 'resolved' }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">未解决</SelectItem>
                    <SelectItem value="in_progress">处理中</SelectItem>
                    <SelectItem value="resolved">已解决</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>责任人</Label>
              <Input
                value={blockerForm.owner}
                onChange={(e) => setBlockerForm((prev) => ({ ...prev, owner: e.target.value }))}
                placeholder="可选"
              />
            </div>
            <div className="space-y-2">
              <Label>备注</Label>
              <Textarea
                value={blockerForm.note}
                onChange={(e) => setBlockerForm((prev) => ({ ...prev, note: e.target.value }))}
                rows={2}
                placeholder="可选"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBlockerDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveBlocker}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 组件编辑弹窗 */}
      <Dialog open={componentDialogOpen} onOpenChange={setComponentDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑组件版本 - {plan.version}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {allComponents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无组件库，请先在系统设置中添加组件
              </div>
            ) : (
              <>
                {/* 前端组件 */}
                <div>
                  <h3 className="font-medium mb-2">前端组件</h3>
                  <div className="space-y-2">
                    {allComponents.filter(c => c.type === 'frontend').map((component) => {
                      const enabled = isComponentEnabled(component.name)
                      const config = getComponentConfig(component.name)
                      return (
                        <div key={component.name} className="flex items-center gap-4 p-3 border rounded-lg">
                          <Checkbox
                            checked={enabled}
                            onCheckedChange={() => toggleComponent(component.name)}
                          />
                          <span className="font-mono text-sm flex-1">{component.name}</span>
                          {enabled && config && (
                            <>
                              <Input
                                type="text"
                                value={config.currentVersion}
                                onChange={(e) => updateComponentVersion(component.name, 'currentVersion', e.target.value)}
                                className="w-24"
                                placeholder="当前版本"
                              />
                              <span className="text-muted-foreground">→</span>
                              <Input
                                type="text"
                                value={config.targetVersion}
                                onChange={(e) => updateComponentVersion(component.name, 'targetVersion', e.target.value)}
                                className="w-24"
                                placeholder="目标版本"
                              />
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* 后端组件 */}
                <div>
                  <h3 className="font-medium mb-2">后端组件</h3>
                  <div className="space-y-2">
                    {allComponents.filter(c => c.type === 'backend').map((component) => {
                      const enabled = isComponentEnabled(component.name)
                      const config = getComponentConfig(component.name)
                      return (
                        <div key={component.name} className="flex items-center gap-4 p-3 border rounded-lg">
                          <Checkbox
                            checked={enabled}
                            onCheckedChange={() => toggleComponent(component.name)}
                          />
                          <span className="font-mono text-sm flex-1">{component.name}</span>
                          {enabled && config && (
                            <>
                              <Input
                                type="text"
                                value={config.currentVersion}
                                onChange={(e) => updateComponentVersion(component.name, 'currentVersion', e.target.value)}
                                className="w-24"
                                placeholder="当前版本"
                              />
                              <span className="text-muted-foreground">→</span>
                              <Input
                                type="text"
                                value={config.targetVersion}
                                onChange={(e) => updateComponentVersion(component.name, 'targetVersion', e.target.value)}
                                className="w-24"
                                placeholder="目标版本"
                              />
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComponentDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveComponents}>
              <Save className="h-4 w-4 mr-2" />
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
