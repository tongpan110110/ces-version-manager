'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
  ArrowLeft,
  Copy,
  GitCompare,
  Download,
  Edit,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Save,
  Trash2,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { usePlans } from '@/hooks/useLocalData'

interface ManifestComponent {
  id: string
  componentName: string
  targetVersion: string
  changeType: string
  changeReason: string
}

interface PlanDetail {
  id: string
  version: string
  type: string
  status: string
  summary: string
  relatedRequirements: string
  relatedBugs: string
  createdAt: string
  updatedAt: string
  manifest: {
    id: string
    frontendVersion: string
    frontendChangeType: string
    frontendChangeReason: string
    feBeCheckStatus: string
    feBeCheckMessage: string
    dependencyCheckStatus: string
    dependencyCheckMessage: string
    components: ManifestComponent[]
  } | null
  regionVersions: Array<{
    region: {
      id: string
      name: string
      area: string
    }
    backendReady: boolean
    frontendReady: boolean
  }>
}

export default function PlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { toast } = useToast()
  const { plans, updatePlan, deletePlan: deletePlanFn, loading: plansLoading } = usePlans()
  const [plan, setPlan] = useState<PlanDetail | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editManifestOpen, setEditManifestOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editingComponent, setEditingComponent] = useState<ManifestComponent | null>(null)

  // Edit form states
  const [editSummary, setEditSummary] = useState('')
  const [editRequirements, setEditRequirements] = useState('')
  const [editBugs, setEditBugs] = useState('')

  // Manifest edit states
  const [frontendVersion, setFrontendVersion] = useState('')
  const [frontendChangeType, setFrontendChangeType] = useState('')
  const [frontendChangeReason, setFrontendChangeReason] = useState('')

  useEffect(() => {
    if (!plansLoading && params.planId) {
      const foundPlan = plans.find(p => p.id === params.planId)
      if (foundPlan) {
        // Convert to PlanDetail format
        const planDetail: PlanDetail = {
          ...foundPlan,
          manifest: null, // No manifest data in localStorage
          regionVersions: [] // No region version data here
        }
        setPlan(planDetail)
        setEditSummary(foundPlan.summary)
        const reqs = JSON.parse(foundPlan.relatedRequirements || '[]')
        const bugs = JSON.parse(foundPlan.relatedBugs || '[]')
        setEditRequirements(Array.isArray(reqs) ? reqs.join(', ') : '')
        setEditBugs(Array.isArray(bugs) ? bugs.join(', ') : '')
      } else {
        setPlan(null)
      }
    }
  }, [params.planId, plans, plansLoading])

  const handleStatusChange = (newStatus: string) => {
    if (params.planId) {
      updatePlan(params.planId as string, { status: newStatus })
      setPlan(prev => prev ? { ...prev, status: newStatus } : null)
      toast({
        title: '状态已更新',
        description: `计划状态已更新为 ${statusMap[newStatus]?.label}`,
      })
    }
  }

  const handleSavePlan = () => {
    const reqArray = editRequirements.split(',').map(s => s.trim()).filter(Boolean)
    const bugArray = editBugs.split(',').map(s => s.trim()).filter(Boolean)

    if (params.planId) {
      updatePlan(params.planId as string, {
        summary: editSummary,
        relatedRequirements: JSON.stringify(reqArray),
        relatedBugs: JSON.stringify(bugArray),
      })
      setPlan(prev => prev ? {
        ...prev,
        summary: editSummary,
        relatedRequirements: JSON.stringify(reqArray),
        relatedBugs: JSON.stringify(bugArray),
      } : null)
      setEditDialogOpen(false)
      toast({
        title: '保存成功',
        description: '计划信息已更新',
      })
    }
  }

  const handleSaveManifest = () => {
    // Manifest editing not supported in localStorage mode
    toast({
      variant: 'destructive',
      title: '功能不可用',
      description: '当前使用本地存储模式，不支持编辑清单数据',
    })
    setEditManifestOpen(false)
  }

  const handleSaveComponent = (component: ManifestComponent) => {
    // Component editing not supported in localStorage mode
    toast({
      variant: 'destructive',
      title: '功能不可用',
      description: '当前使用本地存储模式，不支持编辑组件数据',
    })
    setEditingComponent(null)
  }

  const handleDeletePlan = () => {
    setDeleting(true)
    try {
      if (params.planId) {
        deletePlanFn(params.planId as string)
        toast({
          title: '删除成功',
          description: `版本计划 ${plan?.version} 已标记为废弃`,
        })
        router.push('/plans')
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '删除失败',
        description: error instanceof Error ? error.message : '删除失败',
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
    }
  }

  const statusMap: Record<string, { label: string; variant: any; next?: string; nextLabel?: string }> = {
    draft: { label: '草稿', variant: 'draft', next: 'testing', nextLabel: '提交测试' },
    testing: { label: '待测试', variant: 'testing', next: 'ready', nextLabel: '测试通过' },
    ready: { label: '待发布', variant: 'ready', next: 'released', nextLabel: '确认发布' },
    released: { label: '已发布', variant: 'released' },
    deprecated: { label: '已废弃', variant: 'deprecated' },
  }

  if (plansLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-destructive">计划不存在</div>
      </div>
    )
  }

  const checkStatusIcon = (status: string) => {
    switch (status) {
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-success" />
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-warning" />
      case 'error':
        return <XCircle className="h-4 w-4 text-destructive" />
      default:
        return null
    }
  }

  const requirements = JSON.parse(plan.relatedRequirements || '[]')
  const bugs = JSON.parse(plan.relatedBugs || '[]')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <h1 className="text-3xl font-bold font-mono text-primary neon-text">
              {plan.version}
            </h1>
            <Badge variant={plan.type === 'Patch' ? 'warning' : 'secondary'}>
              {plan.type === 'Release' ? '需求版' : '补丁版'}
            </Badge>
            <Badge variant={statusMap[plan.status]?.variant || 'outline'}>
              {statusMap[plan.status]?.label || plan.status}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">{plan.summary}</p>
        </div>
        <div className="flex gap-2">
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                编辑计划
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>编辑发布计划</DialogTitle>
                <DialogDescription>
                  修改发布计划的基本信息
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>计划描述</Label>
                  <Textarea
                    value={editSummary}
                    onChange={(e) => setEditSummary(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>关联需求 (用逗号分隔)</Label>
                  <Input
                    value={editRequirements}
                    onChange={(e) => setEditRequirements(e.target.value)}
                    placeholder="REQ-001, REQ-002"
                  />
                </div>
                <div className="space-y-2">
                  <Label>关联问题 (用逗号分隔)</Label>
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

          {statusMap[plan.status]?.next && (
            <Button onClick={() => handleStatusChange(statusMap[plan.status].next!)}>
              {statusMap[plan.status].nextLabel}
            </Button>
          )}
          <Button variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            复制创建
          </Button>
          <Button variant="outline">
            <GitCompare className="h-4 w-4 mr-2" />
            版本对比
          </Button>

          <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                删除计划
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>确认删除计划</DialogTitle>
                <DialogDescription>
                  确定要删除版本计划 <span className="font-mono font-semibold">{plan.version}</span> 吗？
                  <br />
                  此操作将把计划标记为&quot;已废弃&quot;状态，不会物理删除数据。
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setDeleteDialogOpen(false)}
                  disabled={deleting}
                >
                  取消
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeletePlan}
                  disabled={deleting}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {deleting ? '删除中...' : '确认删除'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">关联需求</CardTitle>
          </CardHeader>
          <CardContent>
            {requirements.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {requirements.map((req: string) => (
                  <Badge key={req} variant="outline" className="text-xs">
                    {req}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">无</span>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">关联问题</CardTitle>
          </CardHeader>
          <CardContent>
            {bugs.length > 0 ? (
              <div className="flex flex-wrap gap-1">
                {bugs.map((bug: string) => (
                  <Badge key={bug} variant="destructive" className="text-xs">
                    {bug}
                  </Badge>
                ))}
              </div>
            ) : (
              <span className="text-muted-foreground text-sm">无</span>
            )}
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">覆盖局点</CardTitle>
          </CardHeader>
          <CardContent>
            <span className="text-2xl font-bold text-primary">
              {plan.regionVersions.length}
            </span>
            <span className="text-muted-foreground text-sm ml-2">个局点</span>
          </CardContent>
        </Card>
      </div>

      {/* Manifest */}
      {plan.manifest && (
        <>
          {/* Check Status */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {checkStatusIcon(plan.manifest.feBeCheckStatus)}
                  <div>
                    <p className="font-medium">前后端配套检查</p>
                    <p className="text-sm text-muted-foreground">
                      {plan.manifest.feBeCheckMessage || '检查通过'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  {checkStatusIcon(plan.manifest.dependencyCheckStatus)}
                  <div>
                    <p className="font-medium">关键依赖检查</p>
                    <p className="text-sm text-muted-foreground">
                      {plan.manifest.dependencyCheckMessage || '检查通过'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Frontend */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>前端版本</CardTitle>
              <Dialog open={editManifestOpen} onOpenChange={setEditManifestOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Edit className="h-4 w-4 mr-2" />
                    编辑前端
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>编辑前端版本</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>目标版本</Label>
                      <Input
                        value={frontendVersion}
                        onChange={(e) => setFrontendVersion(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>变更类型</Label>
                      <Select value={frontendChangeType} onValueChange={setFrontendChangeType}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="upgrade">升级</SelectItem>
                          <SelectItem value="unchanged">不变</SelectItem>
                          <SelectItem value="new">新增</SelectItem>
                          <SelectItem value="removed">移除</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>变更原因</Label>
                      <Textarea
                        value={frontendChangeReason}
                        onChange={(e) => setFrontendChangeReason(e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setEditManifestOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleSaveManifest}>
                      <Save className="h-4 w-4 mr-2" />
                      保存
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <span className="font-mono text-lg">CES-Portal</span>
                <span className="font-mono text-primary font-bold">
                  {plan.manifest.frontendVersion}
                </span>
                <Badge variant={plan.manifest.frontendChangeType === 'upgrade' ? 'success' : 'outline'}>
                  {plan.manifest.frontendChangeType === 'upgrade' ? '升级' : '不变'}
                </Badge>
                {plan.manifest.frontendChangeReason && (
                  <span className="text-sm text-muted-foreground">
                    {plan.manifest.frontendChangeReason}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Backend Components */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>后端组件版本</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  导出
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">组件名称</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">目标版本</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">变更类型</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">变更原因</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {plan.manifest.components.map((component, index) => (
                      <tr
                        key={component.id}
                        className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                      >
                        <td className="px-4 py-3 font-mono text-sm">
                          {component.componentName}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-primary">
                          {editingComponent?.id === component.id ? (
                            <Input
                              value={editingComponent.targetVersion}
                              onChange={(e) =>
                                setEditingComponent({
                                  ...editingComponent,
                                  targetVersion: e.target.value,
                                })
                              }
                              className="h-8 w-24"
                            />
                          ) : (
                            component.targetVersion
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingComponent?.id === component.id ? (
                            <Select
                              value={editingComponent.changeType}
                              onValueChange={(value) =>
                                setEditingComponent({
                                  ...editingComponent,
                                  changeType: value,
                                })
                              }
                            >
                              <SelectTrigger className="h-8 w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="upgrade">升级</SelectItem>
                                <SelectItem value="unchanged">不变</SelectItem>
                                <SelectItem value="new">新增</SelectItem>
                                <SelectItem value="removed">移除</SelectItem>
                              </SelectContent>
                            </Select>
                          ) : (
                            <Badge
                              variant={
                                component.changeType === 'upgrade'
                                  ? 'success'
                                  : component.changeType === 'new'
                                  ? 'secondary'
                                  : 'outline'
                              }
                            >
                              {component.changeType === 'upgrade'
                                ? '升级'
                                : component.changeType === 'new'
                                ? '新增'
                                : component.changeType === 'removed'
                                ? '下线'
                                : '不变'}
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {editingComponent?.id === component.id ? (
                            <Input
                              value={editingComponent.changeReason}
                              onChange={(e) =>
                                setEditingComponent({
                                  ...editingComponent,
                                  changeReason: e.target.value,
                                })
                              }
                              className="h-8"
                            />
                          ) : (
                            component.changeReason || '-'
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {editingComponent?.id === component.id ? (
                            <div className="flex gap-1">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleSaveComponent(editingComponent)}
                              >
                                <Save className="h-3 w-3" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingComponent(null)}
                              >
                                取消
                              </Button>
                            </div>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingComponent(component)}
                            >
                              <Edit className="h-3 w-3" />
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Meta */}
      <div className="text-sm text-muted-foreground">
        创建于 {formatDate(plan.createdAt)} · 更新于 {formatDate(plan.updatedAt)}
      </div>
    </div>
  )
}
