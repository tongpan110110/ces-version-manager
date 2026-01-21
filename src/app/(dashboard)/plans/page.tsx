'use client'

import { useEffect, useState, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Plus, Search, ChevronRight, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useRouter, useSearchParams } from 'next/navigation'
import { usePlans } from '@/hooks/useLocalData'

interface Plan {
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

export default function PlansPage() {
  const { plans, createPlan, deletePlan, loading } = usePlans()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()

  // 从 URL 读取筛选参数
  const [search, setSearch] = useState(searchParams.get('search') || '')
  const [versionLineFilter, setVersionLineFilter] = useState(searchParams.get('versionLine') || 'all')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [typeFilter, setTypeFilter] = useState(searchParams.get('type') || 'all')

  // 新建计划弹窗
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newVersion, setNewVersion] = useState('')
  const [newType, setNewType] = useState('Feature Release')
  const [newSummary, setNewSummary] = useState('')
  const [newRequirements, setNewRequirements] = useState('')
  const [newBugs, setNewBugs] = useState('')

  // 删除确认弹窗
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [planToDelete, setPlanToDelete] = useState<Plan | null>(null)

  // 版本线选项（从 localStorage 读取）
  const [versionLines, setVersionLines] = useState<string[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('settings_versionLines')
      if (saved) {
        const vls = JSON.parse(saved)
        setVersionLines(vls.map((vl: any) => vl.versionLine))
      }
    }
  }, [])

  // 更新 URL 参数
  const updateURL = (params: Record<string, string>) => {
    const newParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all') {
        newParams.set(key, value)
      }
    })
    const newURL = `/plans${newParams.toString() ? '?' + newParams.toString() : ''}`
    router.replace(newURL)
  }

  // 筛选和排序
  const filteredPlans = useMemo(() => {
    let result = [...plans]

    // 搜索筛选
    if (search) {
      result = result.filter(plan =>
        plan.version.includes(search) || plan.summary.includes(search)
      )
    }

    // 版本线筛选
    if (versionLineFilter !== 'all') {
      result = result.filter(plan => plan.versionLine === versionLineFilter)
    }

    // 状态筛选
    if (statusFilter !== 'all') {
      result = result.filter(plan => plan.status === statusFilter)
    }

    // 类型筛选
    if (typeFilter !== 'all') {
      result = result.filter(plan => plan.type === typeFilter)
    }

    // 按创建时间倒序排序
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    return result
  }, [plans, search, versionLineFilter, statusFilter, typeFilter])

  // 状态映射（新术语）
  const statusMap: Record<string, { label: string; variant: any }> = {
    draft: { label: '开发中', variant: 'draft' },
    testing: { label: '测试中', variant: 'testing' },
    released: { label: '研发出包', variant: 'released' },
    upgrading: { label: '升级中', variant: 'upgrading' },
    completed: { label: '已完成', variant: 'completed' },
  }

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
      // 从版本号提取版本线
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
      // 重置表单
      setNewVersion('')
      setNewType('Feature Release')
      setNewSummary('')
      setNewRequirements('')
      setNewBugs('')
      // 跳转到详情页
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

  const handleClearFilters = () => {
    setSearch('')
    setVersionLineFilter('all')
    setStatusFilter('all')
    setTypeFilter('all')
    updateURL({})
  }

  const hasActiveFilters = search || versionLineFilter !== 'all' || statusFilter !== 'all' || typeFilter !== 'all'

  // 删除计划
  const handleDeleteClick = (plan: Plan) => {
    setPlanToDelete(plan)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (planToDelete) {
      deletePlan(planToDelete.id)

      toast({
        title: '删除成功',
        description: `版本计划 ${planToDelete.version} 已删除`,
      })

      setDeleteDialogOpen(false)
      setPlanToDelete(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">发布计划</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            管理所有版本发布计划
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          新建计划
        </Button>
      </div>

      {/* 新建计划弹窗 */}
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
                    <SelectItem value="Feature Release">Feature Release</SelectItem>
                    <SelectItem value="Update Release">Update Release</SelectItem>
                    <SelectItem value="Patch">Patch</SelectItem>
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

      {/* 筛选区 */}
      <Card className="glass">
        <CardContent className="pt-4">
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="搜索版本号或描述..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  updateURL({ search: e.target.value, versionLine: versionLineFilter, status: statusFilter, type: typeFilter })
                }}
                className="pl-9"
              />
            </div>
            <Select
              value={versionLineFilter}
              onValueChange={(value) => {
                setVersionLineFilter(value)
                updateURL({ search, versionLine: value, status: statusFilter, type: typeFilter })
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="版本线" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部版本线</SelectItem>
                {versionLines.map(vl => (
                  <SelectItem key={vl} value={vl}>{vl}.x</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                updateURL({ search, versionLine: versionLineFilter, status: value, type: typeFilter })
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="draft">开发中</SelectItem>
                <SelectItem value="testing">测试中</SelectItem>
                <SelectItem value="released">研发出包</SelectItem>
                <SelectItem value="upgrading">升级中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter}
              onValueChange={(value) => {
                setTypeFilter(value)
                updateURL({ search, versionLine: versionLineFilter, status: statusFilter, type: value })
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类型</SelectItem>
                <SelectItem value="Feature Release">Feature Release</SelectItem>
                <SelectItem value="Update Release">Update Release</SelectItem>
                <SelectItem value="Patch">Patch</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 计划列表 */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">加载中...</div>
      ) : filteredPlans.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters ? '暂无符合条件的发布计划' : '暂无发布计划'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                清除筛选条件
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredPlans.map((plan) => (
            <Card key={plan.id} className="glass hover:border-primary/50 transition-all relative">
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-3 right-3 h-8 w-8 text-muted-foreground hover:text-destructive z-10"
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleDeleteClick(plan)
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
              <Link href={`/plans/${plan.id}`}>
                <CardContent className="p-4 pr-12 cursor-pointer">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <span className="text-lg font-mono font-bold text-primary">
                        {plan.version}
                      </span>
                      <div className="flex items-center gap-2">
                        <Badge variant={
                          plan.type === 'Patch' ? 'warning' :
                          plan.type === 'Feature Release' ? 'default' :
                          'outline'
                        } className="text-xs">
                          {plan.type}
                        </Badge>
                        <Badge variant={statusMap[plan.status]?.variant || 'outline'} className="text-xs">
                          {statusMap[plan.status]?.label || plan.status}
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>

                  <div className="mt-2 text-sm text-muted-foreground">
                    {plan.summary}
                  </div>
                </CardContent>
              </Link>
            </Card>
          ))}
        </div>
      )}

      {/* 删除确认对话框 */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              确定要删除版本计划 <span className="font-mono font-semibold text-foreground">
                {planToDelete?.version}
              </span> 吗？此操作无法撤销。
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleConfirmDelete}>
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
