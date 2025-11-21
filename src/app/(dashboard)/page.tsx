'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Package,
  Map,
  CheckCircle,
  AlertCircle,
  Clock,
  Rocket,
  FileCheck,
  TrendingUp,
  GitBranch,
  Target,
  ExternalLink
} from 'lucide-react'

interface VersionLineStats {
  versionLine: string
  baseline: string
  totalRegions: number
  atBaseline: number
  behindBaseline: number
  alignmentRate: number
  coverage: number
}

interface DashboardData {
  stats: {
    totalPlans: number
    draftPlans: number
    testingPlans: number
    readyPlans: number
    releasedPlans: number
    totalRegions: number
    totalAlignedRegions: number
    overallAlignmentRate: number
  }
  versionLines: VersionLineStats[]
  recentPlans: Array<{
    id: string
    version: string
    versionLine: string
    type: string
    status: string
    summary: string
    updatedAt: string
  }>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedVersionLine, setSelectedVersionLine] = useState<string>('')

  useEffect(() => {
    fetch('/api/dashboard')
      .then(res => res.json())
      .then(res => {
        if (res.success) {
          setData(res.data)
          // Auto-select first version line
          if (res.data.versionLines.length > 0) {
            setSelectedVersionLine(res.data.versionLines[0].versionLine)
          }
        }
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
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

  const statusMap: Record<string, { label: string; variant: any }> = {
    draft: { label: '草稿', variant: 'draft' },
    testing: { label: '待测试', variant: 'testing' },
    ready: { label: '待发布', variant: 'ready' },
    released: { label: '已发布', variant: 'released' },
    deprecated: { label: '已废弃', variant: 'deprecated' },
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">仪表盘</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            多版本线全网概览与整体进度
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">整体对齐率</p>
          <p className="text-3xl font-bold text-primary neon-text">
            {data.stats.overallAlignmentRate}%
          </p>
        </div>
      </div>

      {/* Overall Stats Grid */}
      <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">发布计划总数</CardTitle>
            <Package className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold">{data.stats.totalPlans}</div>
            <p className="text-xs text-muted-foreground">
              已发布 {data.stats.releasedPlans} 个
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">全网对齐进度</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-success">
              {data.stats.overallAlignmentRate}%
            </div>
            <p className="text-xs text-muted-foreground">
              {data.stats.totalAlignedRegions}/{data.stats.totalRegions} 局点对齐各版本线基线
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">待测试</CardTitle>
            <Clock className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-warning">
              {data.stats.testingPlans}
            </div>
            <p className="text-xs text-muted-foreground">
              等待测试验证
            </p>
          </CardContent>
        </Card>

        <Card className="glass">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium">待发布</CardTitle>
            <Rocket className="h-4 w-4 text-secondary" />
          </CardHeader>
          <CardContent className="pb-3">
            <div className="text-2xl font-bold text-secondary">
              {data.stats.readyPlans}
            </div>
            <p className="text-xs text-muted-foreground">
              等待发布上线
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Version Lines Section with Tabs */}
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GitBranch className="h-4 w-4 text-primary" />
            版本线进度
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          {data.versionLines.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              暂无活跃版本线，请在系统设置中配置
            </p>
          ) : (
            <Tabs value={selectedVersionLine} onValueChange={setSelectedVersionLine}>
              <TabsList className="w-full justify-start">
                {data.versionLines.map((vl) => (
                  <TabsTrigger key={vl.versionLine} value={vl.versionLine} className="gap-2">
                    <span className="font-mono">{vl.versionLine}.x</span>
                    <Badge variant="outline" className="text-xs">
                      {vl.alignmentRate}%
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>

              {data.versionLines.map((versionLine) => (
                <TabsContent key={versionLine.versionLine} value={versionLine.versionLine} className="space-y-3 mt-4">
                  {/* Version Line Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold font-mono text-primary">
                        {versionLine.versionLine}.x
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        当前基线版本：<span className="font-mono font-semibold">{versionLine.baseline}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">对齐率</p>
                      <p className="text-2xl font-bold text-success">
                        {versionLine.alignmentRate}%
                      </p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-success to-success/70 transition-all"
                        style={{ width: `${versionLine.alignmentRate}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats Grid - Only 2 columns now */}
                  <div className="grid grid-cols-2 gap-3">
                    <Card className="glass border-success/30">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                          <CheckCircle className="h-8 w-8 text-success" />
                          <div>
                            <p className="text-2xl font-bold text-success">
                              {versionLine.atBaseline}
                            </p>
                            <p className="text-xs text-muted-foreground">已对齐基线</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="glass border-warning/30">
                      <CardContent className="py-4">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="h-8 w-8 text-warning" />
                          <div>
                            <p className="text-2xl font-bold text-warning">
                              {versionLine.behindBaseline}
                            </p>
                            <p className="text-xs text-muted-foreground">待升级</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Coverage */}
                  <Card className="glass">
                    <CardContent className="py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">版本线覆盖</span>
                        <div className="text-right">
                          <p className="text-lg font-bold">
                            {versionLine.totalRegions}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            局点 ({versionLine.coverage}%)
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Recent Plans - Filtered by selected version line */}
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileCheck className="h-4 w-4 text-primary" />
            最近更新的版本计划
            {selectedVersionLine && (
              <Badge variant="outline" className="font-mono text-xs">
                {selectedVersionLine}.x
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-2">
            {data.recentPlans
              .filter(plan => !selectedVersionLine || plan.versionLine === selectedVersionLine)
              .slice(0, 5)
              .map((plan) => (
                <Link key={plan.id} href={`/plans/${plan.id}`}>
                  <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50 hover:bg-muted hover:border-primary/30 border border-transparent transition-all cursor-pointer group">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="flex flex-col">
                        <span className="font-mono text-sm text-primary font-semibold group-hover:text-primary/90">
                          {plan.version}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {plan.versionLine}.x
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground flex-1 truncate">
                        {plan.summary}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={plan.type === 'Patch' ? 'warning' : 'default'} className="text-xs">
                        {plan.type}
                      </Badge>
                      <Badge variant={statusMap[plan.status]?.variant || 'outline'} className="text-xs">
                        {statusMap[plan.status]?.label || plan.status}
                      </Badge>
                      <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                </Link>
              ))}
            {data.recentPlans.filter(plan => !selectedVersionLine || plan.versionLine === selectedVersionLine).length === 0 && (
              <p className="text-muted-foreground text-center py-4">
                该版本线暂无版本计划
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Stats Summary */}
      <div className="grid gap-3 md:grid-cols-3">
        <Card className="glass border-success/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-7 w-7 text-success" />
              <div>
                <p className="text-xl font-bold">{data.stats.totalAlignedRegions}</p>
                <p className="text-xs text-muted-foreground">局点对齐基线</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-primary/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <GitBranch className="h-7 w-7 text-primary" />
              <div>
                <p className="text-xl font-bold">{data.versionLines.length}</p>
                <p className="text-xs text-muted-foreground">活跃版本线</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass border-secondary/30">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Map className="h-7 w-7 text-secondary" />
              <div>
                <p className="text-xl font-bold">{data.stats.totalRegions}</p>
                <p className="text-xs text-muted-foreground">生产局点总数</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
