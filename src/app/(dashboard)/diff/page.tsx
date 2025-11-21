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
import { GitCompare, ArrowRight, Download } from 'lucide-react'
import { usePlans } from '@/hooks/useLocalData'
import { useToast } from '@/hooks/use-toast'

interface Plan {
  id: string
  version: string
  type: string
  status: string
}

interface DiffItem {
  componentName: string
  versionA: string
  versionB: string
  changeType: string
  reasonA?: string
  reasonB?: string
}

interface DiffResult {
  planA: { id: string; version: string }
  planB: { id: string; version: string }
  diff: DiffItem[]
  totalChanges: number
}

export default function DiffPage() {
  const { plans, loading: plansLoading } = usePlans()
  const { toast } = useToast()
  const [planAId, setPlanAId] = useState<string>('')
  const [planBId, setPlanBId] = useState<string>('')
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleCompare = () => {
    if (!planAId || !planBId) return

    setLoading(true)

    const planA = plans.find(p => p.id === planAId)
    const planB = plans.find(p => p.id === planBId)

    if (!planA || !planB) {
      toast({
        variant: 'destructive',
        title: '对比失败',
        description: '未找到选中的版本',
      })
      setLoading(false)
      return
    }

    // 对比基本信息
    const diff: DiffItem[] = []

    // 对比版本类型
    if (planA.type !== planB.type) {
      diff.push({
        componentName: '版本类型',
        versionA: planA.type === 'Release' ? '需求版' : '补丁版',
        versionB: planB.type === 'Release' ? '需求版' : '补丁版',
        changeType: 'changed',
      })
    }

    // 对比版本状态
    if (planA.status !== planB.status) {
      const statusMap: Record<string, string> = {
        draft: '草稿',
        testing: '待测试',
        ready: '待发布',
        released: '已发布',
        deprecated: '已废弃'
      }
      diff.push({
        componentName: '版本状态',
        versionA: statusMap[planA.status] || planA.status,
        versionB: statusMap[planB.status] || planB.status,
        changeType: 'changed',
      })
    }

    // 对比描述
    if (planA.summary !== planB.summary) {
      diff.push({
        componentName: '版本描述',
        versionA: planA.summary.substring(0, 30) + (planA.summary.length > 30 ? '...' : ''),
        versionB: planB.summary.substring(0, 30) + (planB.summary.length > 30 ? '...' : ''),
        changeType: 'changed',
        reasonA: planA.summary,
        reasonB: planB.summary,
      })
    }

    // 对比关联需求
    const reqsA = JSON.parse(planA.relatedRequirements || '[]')
    const reqsB = JSON.parse(planB.relatedRequirements || '[]')
    if (JSON.stringify(reqsA) !== JSON.stringify(reqsB)) {
      diff.push({
        componentName: '关联需求',
        versionA: Array.isArray(reqsA) ? reqsA.join(', ') || '无' : '无',
        versionB: Array.isArray(reqsB) ? reqsB.join(', ') || '无' : '无',
        changeType: 'changed',
      })
    }

    // 对比关联问题
    const bugsA = JSON.parse(planA.relatedBugs || '[]')
    const bugsB = JSON.parse(planB.relatedBugs || '[]')
    if (JSON.stringify(bugsA) !== JSON.stringify(bugsB)) {
      diff.push({
        componentName: '关联问题',
        versionA: Array.isArray(bugsA) ? bugsA.join(', ') || '无' : '无',
        versionB: Array.isArray(bugsB) ? bugsB.join(', ') || '无' : '无',
        changeType: 'changed',
      })
    }

    setDiffResult({
      planA: { id: planA.id, version: planA.version },
      planB: { id: planB.id, version: planB.version },
      diff,
      totalChanges: diff.length,
    })

    setLoading(false)

    if (diff.length === 0) {
      toast({
        title: '对比完成',
        description: '两个版本的基本信息完全相同',
      })
    } else {
      toast({
        title: '对比完成',
        description: `发现 ${diff.length} 处差异`,
      })
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">版本对比</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          对比两个版本的基本信息差异（类型、状态、描述、关联需求/问题）
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
                      {plan.version} ({plan.type})
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
                      {plan.version} ({plan.type})
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
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-primary" />
                对比结果
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {diffResult.planA.version} → {diffResult.planB.version}
                <span className="ml-4">
                  共 {diffResult.totalChanges} 处变更
                </span>
              </p>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              导出
            </Button>
          </CardHeader>
          <CardContent>
            {diffResult.diff.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                两个版本的基本信息完全相同
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">对比项</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        {diffResult.planA.version}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        {diffResult.planB.version}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">详细信息</th>
                    </tr>
                  </thead>
                  <tbody>
                    {diffResult.diff.map((item, index) => (
                      <tr
                        key={item.componentName}
                        className={index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                      >
                        <td className="px-4 py-3 font-mono text-sm">
                          {item.componentName}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground">
                          {item.versionA}
                        </td>
                        <td className="px-4 py-3 font-mono text-sm text-primary">
                          {item.versionB}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="warning">
                            差异
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground max-w-md truncate">
                          {item.reasonB || item.reasonA || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
