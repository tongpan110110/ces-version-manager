'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Package,
  Plus,
  Search,
  Filter,
  ChevronRight,
  Calendar,
  Trash2,
} from 'lucide-react'
import { formatDate } from '@/lib/utils'
import { useToast } from '@/hooks/use-toast'
import { useRouter } from 'next/navigation'
import { usePlans } from '@/hooks/useLocalData'

interface Plan {
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
    frontendVersion: string
    frontendChangeType: string
  } | null
  _count: {
    regionVersions: number
  }
}

export default function PlansPage() {
  const { plans, createPlan, deletePlan, loading } = usePlans()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  // Create plan dialog
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newVersion, setNewVersion] = useState('')
  const [newType, setNewType] = useState('Release')
  const [newSummary, setNewSummary] = useState('')
  const [newRequirements, setNewRequirements] = useState('')
  const [newBugs, setNewBugs] = useState('')

  // Delete plan dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<any>(null)

  const { toast } = useToast()
  const router = useRouter()

  const handleCreatePlan = async () => {
    if (!newVersion || !newSummary) {
      toast({
        variant: 'destructive',
        title: '参数错误',
        description: '请填写版本号和摘要',
      })
      return
    }

    setCreating(true)
    try {
      // Extract version line from version
      const versionParts = newVersion.split('.')
      const versionLine = `${versionParts[0]}.${versionParts[1]}`

      const newPlan = createPlan({
        version: newVersion,
        versionLine,
        type: newType,
        summary: newSummary,
        relatedRequirements: JSON.stringify(newRequirements.split(',').map(r => r.trim()).filter(Boolean)),
        relatedBugs: JSON.stringify(newBugs.split(',').map(b => b.trim()).filter(Boolean)),
        status: 'draft',
      })

      toast({
        title: '创建成功',
        description: `版本计划 ${newVersion} 已创建`,
      })
      setCreateDialogOpen(false)
      // Reset form
      setNewVersion('')
      setNewType('Release')
      setNewSummary('')
      setNewRequirements('')
      setNewBugs('')
      // Navigate to the new plan
      router.push(`/plans/${newPlan.id}`)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '创建失败',
        description: error instanceof Error ? error.message : '创建失败',
      })
    } finally {
      setCreating(false)
    }
  }

  const handleDeletePlan = async () => {
    if (!planToDelete) return

    setDeleting(true)
    try {
      deletePlan(planToDelete.id)
      toast({
        title: '删除成功',
        description: `版本计划 ${planToDelete.version} 已标记为废弃`,
      })
      setDeleteDialogOpen(false)
      setPlanToDelete(null)
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '删除失败',
        description: error instanceof Error ? error.message : '删除失败',
      })
    } finally {
      setDeleting(false)
    }
  }

  const statusMap: Record<string, { label: string; variant: any }> = {
    draft: { label: '草稿', variant: 'draft' },
    testing: { label: '待测试', variant: 'testing' },
    ready: { label: '待发布', variant: 'ready' },
    released: { label: '已发布', variant: 'released' },
    deprecated: { label: '已废弃', variant: 'deprecated' },
  }

  const filteredPlans = plans.filter(plan => {
    // Status filter
    if (statusFilter !== 'all' && plan.status !== statusFilter) return false
    // Type filter
    if (typeFilter !== 'all' && plan.type !== typeFilter) return false
    // Search filter
    if (search && !plan.version.includes(search) && !plan.summary.includes(search)) return false
    return true
  }).map(plan => ({
    ...plan,
    // Add mock data for manifest and _count
    manifest: null,
    _count: { regionVersions: 0 }
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold gradient-text">发布计划</h1>
          <p className="text-muted-foreground mt-1">
            管理所有版本发布计划与交付套件
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          新建计划
        </Button>
      </div>

      {/* Create Plan Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>创建新版本计划</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>版本号 *</Label>
                <Input
                  placeholder="如 25.8.3 或 25.10.0.1"
                  value={newVersion}
                  onChange={(e) => setNewVersion(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  格式：主版本.次版本.修订版[.补丁版]
                </p>
              </div>

              <div className="space-y-2">
                <Label>类型 *</Label>
                <Select value={newType} onValueChange={setNewType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Release">需求版 (Release)</SelectItem>
                    <SelectItem value="Patch">补丁版 (Patch)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>版本摘要 *</Label>
              <Textarea
                placeholder="描述该版本的主要内容..."
                value={newSummary}
                onChange={(e) => setNewSummary(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>关联需求</Label>
              <Input
                placeholder="如 REQ-001, REQ-002（逗号分隔）"
                value={newRequirements}
                onChange={(e) => setNewRequirements(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>关联缺陷</Label>
              <Input
                placeholder="如 BUG-001, BUG-002（逗号分隔）"
                value={newBugs}
                onChange={(e) => setNewBugs(e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                disabled={creating}
              >
                取消
              </Button>
              <Button
                onClick={handleCreatePlan}
                disabled={creating || !newVersion || !newSummary}
              >
                {creating ? '创建中...' : '创建计划'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Plan Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除计划</DialogTitle>
            <DialogDescription>
              确定要删除版本计划 <span className="font-mono font-semibold">{planToDelete?.version}</span> 吗？
              <br />
              此操作将把计划标记为&quot;已废弃&quot;状态，不会物理删除数据。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false)
                setPlanToDelete(null)
              }}
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

      {/* Filters */}
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索版本号或描述..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="testing">待测试</SelectItem>
                <SelectItem value="ready">待发布</SelectItem>
                <SelectItem value="released">已发布</SelectItem>
                <SelectItem value="deprecated">已废弃</SelectItem>
              </SelectContent>
            </Select>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="Release">需求版</SelectItem>
                <SelectItem value="Patch">补丁版</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => {}}>
              <Filter className="h-4 w-4 mr-2" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Plans List */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground">加载中...</div>
      ) : filteredPlans.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          暂无发布计划
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPlans.map((plan) => (
            <Card key={plan.id} className="glass hover:border-primary/50 transition-all group relative">
              <Link href={`/plans/${plan.id}`}>
                <CardContent className="p-6 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-3">
                        <Package className="h-5 w-5 text-primary" />
                        <span className="text-xl font-mono font-bold text-primary">
                          {plan.version}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={plan.type === 'Patch' ? 'warning' : 'secondary'}>
                          {plan.type === 'Release' ? '需求版' : '补丁版'}
                        </Badge>
                        <Badge variant={statusMap[plan.status]?.variant || 'outline'}>
                          {statusMap[plan.status]?.label || plan.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setPlanToDelete(plan)
                          setDeleteDialogOpen(true)
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-muted-foreground">
                    {plan.summary}
                  </div>

                  <div className="mt-4 flex items-center gap-6 text-xs text-muted-foreground">
                    {plan.manifest && (
                      <div>
                        前端: <span className="text-foreground">{plan.manifest.frontendVersion}</span>
                      </div>
                    )}
                    <div>
                      覆盖局点: <span className="text-foreground">{plan._count.regionVersions}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDate(plan.updatedAt)}
                    </div>
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
