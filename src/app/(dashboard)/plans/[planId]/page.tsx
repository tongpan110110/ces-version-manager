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
  const [plan, setPlan] = useState<PlanDetail | null>(null)
  const [loading, setLoading] = useState(true)
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
    fetchPlan()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.planId])

  const fetchPlan = () => {
    if (params.planId) {
      fetch(`/api/plans/${params.planId}`)
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            setPlan(res.data)
            setEditSummary(res.data.summary)
            setEditRequirements(JSON.parse(res.data.relatedRequirements || '[]').join(', '))
            setEditBugs(JSON.parse(res.data.relatedBugs || '[]').join(', '))
            if (res.data.manifest) {
              setFrontendVersion(res.data.manifest.frontendVersion)
              setFrontendChangeType(res.data.manifest.frontendChangeType)
              setFrontendChangeReason(res.data.manifest.frontendChangeReason)
            }
          }
        })
        .finally(() => setLoading(false))
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    const res = await fetch(`/api/plans/${params.planId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    })
    const data = await res.json()
    if (data.success) {
      setPlan(prev => prev ? { ...prev, status: newStatus } : null)
    }
  }

  const handleSavePlan = async () => {
    const reqArray = editRequirements.split(',').map(s => s.trim()).filter(Boolean)
    const bugArray = editBugs.split(',').map(s => s.trim()).filter(Boolean)

    const res = await fetch(`/api/plans/${params.planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        summary: editSummary,
        relatedRequirements: reqArray,
        relatedBugs: bugArray,
      }),
    })
    const data = await res.json()
    if (data.success) {
      fetchPlan()
      setEditDialogOpen(false)
    }
  }

  const handleSaveManifest = async () => {
    if (!plan?.manifest) return

    const res = await fetch(`/api/manifests/${params.planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frontendVersion,
        frontendChangeType,
        frontendChangeReason,
      }),
    })
    const data = await res.json()
    if (data.success) {
      fetchPlan()
      setEditManifestOpen(false)
    }
  }

  const handleSaveComponent = async (component: ManifestComponent) => {
    if (!plan?.manifest) return

    const updatedComponents = plan.manifest.components.map(c =>
      c.id === component.id ? component : c
    )

    const res = await fetch(`/api/manifests/${params.planId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        frontendVersion: plan.manifest.frontendVersion,
        frontendChangeType: plan.manifest.frontendChangeType,
        frontendChangeReason: plan.manifest.frontendChangeReason,
        components: updatedComponents.map(c => ({
          componentName: c.componentName,
          targetVersion: c.targetVersion,
          changeType: c.changeType,
          changeReason: c.changeReason,
        })),
      }),
    })
    const data = await res.json()
    if (data.success) {
      fetchPlan()
      setEditingComponent(null)
    }
  }

  const handleDeletePlan = async () => {
    setDeleting(true)
    try {
      const res = await fetch(`/api/plans/${params.planId}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (data.success) {
        toast({
          title: '删除成功',
          description: `版本计划 ${plan?.version} 已标记为废弃`,
        })
        router.push('/plans')
      } else {
        throw new Error(data.error)
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

  if (loading) {
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

  const statusMap: Record<string, { label: string; variant: any; next?: string; nextLabel?: string }> = {
    draft: { label: '草稿', variant: 'draft', next: 'testing', nextLabel: '提交测试' },
    testing: { label: '待测试', variant: 'testing', next: 'ready', nextLabel: '测试通过' },
    ready: { label: '待发布', variant: 'ready', next: 'released', nextLabel: '确认发布' },
    released: { label: '已发布', variant: 'released' },
    deprecated: { label: '已废弃', variant: 'deprecated' },
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
