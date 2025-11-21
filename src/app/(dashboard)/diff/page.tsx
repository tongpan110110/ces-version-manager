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

    // Version comparison not supported in localStorage mode
    toast({
      variant: 'destructive',
      title: '功能不可用',
      description: '当前使用本地存储模式，不支持版本对比功能。版本对比需要完整的清单数据。',
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold gradient-text">版本对比</h1>
        <p className="text-muted-foreground mt-1">
          对比两个版本之间的组件变更差异
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
                两个版本没有差异
              </div>
            ) : (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium">组件</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        {diffResult.planA.version}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">
                        {diffResult.planB.version}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium">变更</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">原因</th>
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
                          <Badge
                            variant={
                              item.changeType === 'changed'
                                ? 'warning'
                                : item.changeType === 'added'
                                ? 'success'
                                : 'destructive'
                            }
                          >
                            {item.changeType === 'changed'
                              ? '变更'
                              : item.changeType === 'added'
                              ? '新增'
                              : '移除'}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
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
