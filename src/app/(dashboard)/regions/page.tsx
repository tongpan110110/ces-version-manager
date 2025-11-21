'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Map, Filter, CheckCircle, AlertCircle, Clock, Edit } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'

interface Region {
  id: string
  name: string
  area: string
  isGray: boolean
  currentVersion: {
    plan: {
      id: string
      version: string
      versionLine: string
      status: string
    }
    backendReady: boolean
    frontendReady: boolean
  } | null
}

export default function RegionsPage() {
  const [regions, setRegions] = useState<Region[]>([])
  const [plans, setPlans] = useState<any[]>([])
  const [baselines, setBaselines] = useState<Record<string, string>>({})
  const [versionLines, setVersionLines] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [areaFilter, setAreaFilter] = useState('all')
  const [versionLineFilter, setVersionLineFilter] = useState('all')

  // Edit dialog state
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [selectedPlanId, setSelectedPlanId] = useState('')
  const [backendReady, setBackendReady] = useState(false)
  const [frontendReady, setFrontendReady] = useState(false)
  const [saving, setSaving] = useState(false)

  const { toast } = useToast()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [regionsRes, plansRes] = await Promise.all([
        fetch('/api/regions'),
        fetch('/api/plans')
      ])

      const regionsData = await regionsRes.json()
      const plansData = await plansRes.json()

      if (regionsData.success) {
        setRegions(regionsData.data.regions || [])
        setBaselines(regionsData.data.baselines || {})
        setVersionLines(regionsData.data.versionLines || [])
      }

      if (plansData.success) {
        setPlans(plansData.data || [])
      }
    } catch (error) {
      console.error('Error loading data:', error)
      toast({
        variant: 'destructive',
        title: '加载失败',
        description: '无法加载数据',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEditRegion = (region: Region) => {
    setEditingRegion(region)
    setSelectedPlanId(region.currentVersion?.plan.id || '')
    setBackendReady(region.currentVersion?.backendReady || false)
    setFrontendReady(region.currentVersion?.frontendReady || false)
    setEditDialogOpen(true)
  }

  const handleSaveRegion = async () => {
    if (!editingRegion) return

    setSaving(true)
    try {
      const res = await fetch(`/api/regions/${editingRegion.id}/version`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: selectedPlanId,
          backendReady,
          frontendReady,
        }),
      })

      const data = await res.json()
      if (data.success) {
        toast({
          title: '保存成功',
          description: `已更新局点 ${editingRegion.name} 的版本信息`,
        })
        setEditDialogOpen(false)
        loadData()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '保存失败',
        description: error instanceof Error ? error.message : '保存失败',
      })
    } finally {
      setSaving(false)
    }
  }

  const getVersionStatus = (region: Region) => {
    if (!region.currentVersion) return 'unknown'

    const versionLine = region.currentVersion.plan.versionLine
    const baseline = baselines[versionLine]

    if (!baseline) return 'unknown'

    const currentVersion = region.currentVersion.plan.version
    if (currentVersion === baseline) return 'aligned'

    // Simple comparison - in real app would need proper version comparison
    const currentParts = currentVersion.split('.').map(Number)
    const baselineParts = baseline.split('.').map(Number)

    for (let i = 0; i < Math.max(currentParts.length, baselineParts.length); i++) {
      const c = currentParts[i] || 0
      const b = baselineParts[i] || 0
      if (c < b) return i < 2 ? 'behind_many' : 'behind_one'
      if (c > b) return 'ahead'
    }
    return 'aligned'
  }

  // Version line color mapping
  const versionLineColors: Record<string, string> = {
    '25.8': 'border-cyan-500/50 bg-cyan-500/10',
    '25.10': 'border-purple-500/50 bg-purple-500/10',
  }

  const statusConfig: Record<string, { color: string; label: string; icon: any }> = {
    aligned: { color: 'border-success bg-success/10', label: '已对齐', icon: CheckCircle },
    behind_one: { color: 'border-warning bg-warning/10', label: '略落后', icon: Clock },
    behind_many: { color: 'border-destructive bg-destructive/10', label: '待升级', icon: AlertCircle },
    ahead: { color: 'border-primary bg-primary/10', label: '超前', icon: CheckCircle },
    unknown: { color: 'border-muted bg-muted/10', label: '未知', icon: AlertCircle },
  }

  const areaNames: Record<string, string> = {
    domestic: '国内',
    apac: '亚太/中东',
    africa: '非洲',
    latam: '拉美',
  }

  const filteredRegions = regions.filter(region => {
    const matchesArea = areaFilter === 'all' || region.area === areaFilter
    const matchesVersionLine = versionLineFilter === 'all' ||
      region.currentVersion?.plan.versionLine === versionLineFilter
    return matchesArea && matchesVersionLine
  })

  // Group by area
  const groupedRegions = filteredRegions.reduce((acc, region) => {
    const area = region.area
    if (!acc[area]) acc[area] = []
    acc[area].push(region)
    return acc
  }, {} as Record<string, Region[]>)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">局点版本视图</h1>
          <p className="text-muted-foreground mt-1">
            多版本线全网局点当前版本状态一览
          </p>
        </div>
        {versionLines.length > 0 && (
          <div className="text-right">
            <p className="text-sm text-muted-foreground">活跃版本线</p>
            <div className="flex gap-2 mt-1">
              {versionLines.map(vl => (
                <Badge key={vl} variant="outline" className="font-mono">
                  {vl}.x @ {baselines[vl]}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <Select value={areaFilter} onValueChange={setAreaFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择区域" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部区域</SelectItem>
                <SelectItem value="domestic">国内</SelectItem>
                <SelectItem value="apac">亚太/中东</SelectItem>
                <SelectItem value="africa">非洲</SelectItem>
                <SelectItem value="latam">拉美</SelectItem>
              </SelectContent>
            </Select>

            <Select value={versionLineFilter} onValueChange={setVersionLineFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="选择版本线" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部版本线</SelectItem>
                {versionLines.map(vl => (
                  <SelectItem key={vl} value={vl}>{vl}.x</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Legend */}
            <div className="flex-1 flex items-center justify-end gap-4 text-sm">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-cyan-500"></div>
                <span className="text-muted-foreground">25.8.x</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-purple-500"></div>
                <span className="text-muted-foreground">25.10.x</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-success"></div>
                <span className="text-muted-foreground">已对齐</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 rounded bg-warning"></div>
                <span className="text-muted-foreground">落后</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Region Cards */}
      {Object.entries(groupedRegions).map(([area, areaRegions]) => (
        <div key={area}>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Map className="h-5 w-5 text-primary" />
            {areaNames[area] || area}
            <span className="text-sm text-muted-foreground font-normal">
              ({areaRegions.length} 个局点)
            </span>
          </h2>

          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {areaRegions.map((region) => {
              const status = getVersionStatus(region)
              const config = statusConfig[status]
              const StatusIcon = config.icon
              const versionLine = region.currentVersion?.plan.versionLine
              const versionLineColor = versionLine ? versionLineColors[versionLine] : ''

              return (
                <Card
                  key={region.id}
                  className={cn(
                    'transition-all hover:shadow-lg border-l-4 group',
                    versionLineColor
                  )}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-medium truncate">{region.name}</h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <StatusIcon className={cn(
                          'h-4 w-4',
                          status === 'aligned' && 'text-success',
                          status === 'behind_one' && 'text-warning',
                          status === 'behind_many' && 'text-destructive',
                          status === 'ahead' && 'text-primary'
                        )} />
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleEditRegion(region)}
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {region.currentVersion ? (
                      <>
                        <p className="text-2xl font-mono font-bold text-primary mb-1">
                          {region.currentVersion.plan.version}
                        </p>
                        {versionLine && baselines[versionLine] && (
                          <p className="text-xs text-muted-foreground mb-2">
                            目标: <span className="font-mono font-semibold">{baselines[versionLine]}</span>
                          </p>
                        )}
                        <div className="flex gap-1">
                          <Badge
                            variant={region.currentVersion.backendReady ? 'success' : 'outline'}
                            className="text-[10px]"
                          >
                            BE {region.currentVersion.backendReady ? 'OK' : '-'}
                          </Badge>
                          <Badge
                            variant={region.currentVersion.frontendReady ? 'success' : 'outline'}
                            className="text-[10px]"
                          >
                            FE {region.currentVersion.frontendReady ? 'OK' : '-'}
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <p className="text-muted-foreground text-sm">未设置版本</p>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      ))}

      {/* Edit Region Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>编辑局点版本 - {editingRegion?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>选择版本</Label>
              <Select value={selectedPlanId} onValueChange={setSelectedPlanId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择版本计划" />
                </SelectTrigger>
                <SelectContent>
                  {plans && plans.length > 0 ? (
                    plans.map(plan => (
                      <SelectItem key={plan.id} value={plan.id}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono">{plan.version}</span>
                          <Badge variant="outline" className="text-xs">
                            {plan.versionLine}.x
                          </Badge>
                          <Badge variant={plan.status === 'released' ? 'success' : 'outline'} className="text-xs">
                            {plan.status}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-plans" disabled>
                      暂无可用版本计划
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>后端就绪</Label>
                  <p className="text-xs text-muted-foreground">
                    标记后端组件已部署完成
                  </p>
                </div>
                <Switch
                  checked={backendReady}
                  onCheckedChange={setBackendReady}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>前端就绪</Label>
                  <p className="text-xs text-muted-foreground">
                    标记前端已部署完成
                  </p>
                </div>
                <Switch
                  checked={frontendReady}
                  onCheckedChange={setFrontendReady}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={saving}
              >
                取消
              </Button>
              <Button
                onClick={handleSaveRegion}
                disabled={saving || !selectedPlanId}
              >
                {saving ? '保存中...' : '保存'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
