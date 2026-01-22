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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { GitCompare, ArrowRight, Download, Package, FileText } from 'lucide-react'
import { usePlans } from '@/hooks/useAPI'
import { useToast } from '@/hooks/use-toast'

interface Plan {
  id: string
  version: string
  versionLine: string
  type: string
  status: string
  summary: string
  relatedRequirements: string
  relatedBugs: string
}

interface Component {
  name: string
  type: 'frontend' | 'backend'
  version: string
}

interface ComponentDiff {
  componentName: string
  versionA: string
  versionB: string
  changeType: 'upgrade' | 'unchanged' | 'added' | 'removed'
}

interface NewContent {
  id: string
  description: string
  type: 'requirement' | 'bug'
}

interface DiffResult {
  planA: { id: string; version: string }
  planB: { id: string; version: string }
  componentDiffs: ComponentDiff[]
  newContent: NewContent[]
}

export default function DiffPage() {
  const { plans, loading: plansLoading } = usePlans()
  const { toast } = useToast()
  const [planAId, setPlanAId] = useState<string>('')
  const [planBId, setPlanBId] = useState<string>('')
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)
  const [loading, setLoading] = useState(false)

  // 从 localStorage 读取组件数据
  const [components, setComponents] = useState<Component[]>([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('settings_components')
      if (stored) {
        const comps = JSON.parse(stored)
        // 模拟组件版本数据 - 在实际应用中应该从 manifest 读取
        setComponents(comps.map((c: any) => ({
          name: c.name,
          type: c.type,
          version: '1.0.0', // 默认版本
        })))
      }
    }
  }, [])

  // 模拟：获取某个版本的组件版本
  const getComponentsForPlan = (planVersion: string): Component[] => {
    // 在实际应用中，这里应该从 manifest 读取
    // 现在用模拟数据：根据版本号生成不同的组件版本
    const versionNum = parseFloat(planVersion) || 1.0
    return components.map(c => ({
      ...c,
      version: `${versionNum.toFixed(1)}`,
    }))
  }

  // 简单的版本比较
  const compareVersions = (v1: string, v2: string): number => {
    const parts1 = v1.split('.').map(Number)
    const parts2 = v2.split('.').map(Number)
    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0
      const p2 = parts2[i] || 0
      if (p1 !== p2) return p1 - p2
    }
    return 0
  }

  const handleCompare = async () => {
    if (!planAId || !planBId) return

    setLoading(true)

    try {
      const response = await fetch(`/api/manifests/${planBId}/diff?compareTo=${planAId}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error || '对比失败')
      }

      const diffData = result.data

      // 转换为前端需要的格式
      const componentDiffs: ComponentDiff[] = diffData.diff.map((d: any) => {
        // 映射 changeType
        let changeType: 'upgrade' | 'unchanged' | 'added' | 'removed' = 'unchanged'
        if (d.changeType === 'changed') {
          // 判断是升级还是降级
          const verA = d.versionA === '-' ? '0' : d.versionA
          const verB = d.versionB === '-' ? '0' : d.versionB
          changeType = verA < verB ? 'upgrade' : 'unchanged'
        } else if (d.changeType === 'added') {
          changeType = 'added'
        } else if (d.changeType === 'removed') {
          changeType = 'removed'
        }

        return {
          componentName: d.componentName.replace(' (前端)', ''),
          versionA: d.versionA,
          versionB: d.versionB,
          changeType,
        }
      })

      // 排序：前端组件在前，后端组件按名称排序
      componentDiffs.sort((a, b) => {
        const compA = components.find(c => c.name === a.componentName)
        const compB = components.find(c => c.name === b.componentName)
        if (compA?.type === 'frontend' && compB?.type !== 'frontend') return -1
        if (compA?.type !== 'frontend' && compB?.type === 'frontend') return 1
        return a.componentName.localeCompare(b.componentName)
      })

      // 对比需求和缺陷（暂时保留原逻辑，因为 API 没有返回这些数据）
      const planA = plans.find(p => p.id === planAId)
      const planB = plans.find(p => p.id === planBId)

      const reqsA = planA ? (Array.isArray(planA.relatedRequirements) ? planA.relatedRequirements : JSON.parse(planA.relatedRequirements || '[]')) : []
      const reqsB = planB ? (Array.isArray(planB.relatedRequirements) ? planB.relatedRequirements : JSON.parse(planB.relatedRequirements || '[]')) : []
      const bugsA = planA ? (Array.isArray(planA.relatedBugs) ? planA.relatedBugs : JSON.parse(planA.relatedBugs || '[]')) : []
      const bugsB = planB ? (Array.isArray(planB.relatedBugs) ? planB.relatedBugs : JSON.parse(planB.relatedBugs || '[]')) : []

      // 找出新增的需求
      const newReqs = reqsB.filter((r: string) => !reqsA.includes(r))
      // 找出新增的缺陷
      const newBugs = bugsB.filter((b: string) => !bugsA.includes(b))

      const newContent: NewContent[] = [
        ...newReqs.map((req: string) => ({
          id: req,
          description: `需求 ${req}`,
          type: 'requirement' as const,
        })),
        ...newBugs.map((bug: string) => ({
          id: bug,
          description: `缺陷 ${bug}`,
          type: 'bug' as const,
        })),
      ].sort((a, b) => a.id.localeCompare(b.id))

      setDiffResult({
        planA: diffData.planA,
        planB: diffData.planB,
        componentDiffs,
        newContent,
      })

      setLoading(false)

      const changesCount = componentDiffs.filter(d => d.changeType !== 'unchanged').length
      if (changesCount === 0 && newContent.length === 0) {
        toast({
          title: '对比完成',
          description: '两个版本完全相同',
        })
      } else {
        toast({
          title: '对比完成',
          description: `组件变更 ${changesCount} 处，新增内容 ${newContent.length} 项`,
        })
      }
    } catch (error) {
      console.error('对比失败:', error)
      toast({
        variant: 'destructive',
        title: '对比失败',
        description: error instanceof Error ? error.message : '对比失败',
      })
      setLoading(false)
    }
  }

  const handleExport = () => {
    if (!diffResult) return

    // 导出 CSV
    const headers = ['组件名称', `版本 ${diffResult.planA.version}`, `版本 ${diffResult.planB.version}`, '变更']
    const rows = diffResult.componentDiffs.map(d => [
      d.componentName,
      d.versionA,
      d.versionB,
      d.changeType === 'upgrade' ? '升级' :
      d.changeType === 'unchanged' ? '不变' :
      d.changeType === 'added' ? '新增' : '下线',
    ])

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `diff_${diffResult.planA.version}_to_${diffResult.planB.version}.csv`
    a.click()
    URL.revokeObjectURL(url)

    toast({
      title: '导出成功',
      description: '组件差异已导出为 CSV 文件',
    })
  }

  const changeTypeMap = {
    upgrade: { label: '升级', variant: 'success' as const },
    unchanged: { label: '不变', variant: 'outline' as const },
    added: { label: '新增', variant: 'default' as const },
    removed: { label: '下线', variant: 'destructive' as const },
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">版本对比</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          对比两个版本的组件和需求差异
        </p>
      </div>

      {/* Selector */}
      <Card className="glass">
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground mb-2 block">
                版本 A (基准)
              </label>
              <Select value={planAId} onValueChange={setPlanAId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择基准版本" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <ArrowRight className="h-6 w-6 text-muted-foreground mt-6" />

            <div className="flex-1">
              <label className="text-sm text-muted-foreground mb-2 block">
                版本 B (目标)
              </label>
              <Select value={planBId} onValueChange={setPlanBId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择目标版本" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map(plan => (
                    <SelectItem key={plan.id} value={plan.id}>
                      {plan.version}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              onClick={handleCompare}
              disabled={!planAId || !planBId || loading}
              className="mt-6"
            >
              <GitCompare className="h-4 w-4 mr-2" />
              开始对比
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Diff Result */}
      {loading && (
        <div className="text-center py-12 text-muted-foreground">
          对比中...
        </div>
      )}

      {diffResult && (
        <>
          {/* 组件差异 */}
          <Card className="glass">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  组件差异
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  共 {diffResult.componentDiffs.filter(d => d.changeType !== 'unchanged').length} 处变更
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
            </CardHeader>
            <CardContent>
              {diffResult.componentDiffs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无组件数据
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>组件名称</TableHead>
                      <TableHead>{diffResult.planA.version}</TableHead>
                      <TableHead>{diffResult.planB.version}</TableHead>
                      <TableHead>变更</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diffResult.componentDiffs.map((item) => (
                      <TableRow key={item.componentName}>
                        <TableCell className="font-mono text-sm">
                          {item.componentName}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-muted-foreground">
                          {item.versionA}
                        </TableCell>
                        <TableCell className="font-mono text-sm text-primary">
                          {item.versionB}
                        </TableCell>
                        <TableCell>
                          <Badge variant={changeTypeMap[item.changeType].variant} className="text-xs">
                            {changeTypeMap[item.changeType].label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* 新增内容 */}
          <Card className="glass">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                新增内容
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                共 {diffResult.newContent.length} 项
              </p>
            </CardHeader>
            <CardContent>
              {diffResult.newContent.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  无新增需求或缺陷
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>单号</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>类型</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {diffResult.newContent.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="font-mono text-sm">
                          {item.id}
                        </TableCell>
                        <TableCell className="text-sm">
                          {item.description}
                        </TableCell>
                        <TableCell>
                          <Badge variant={item.type === 'requirement' ? 'secondary' : 'destructive'} className="text-xs">
                            {item.type === 'requirement' ? '需求' : '缺陷'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
