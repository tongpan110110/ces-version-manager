'use client'

import { useEffect, useState, Suspense } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Map, Filter, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useRegions } from '@/hooks/useAPI'
import { RINGS } from '@/lib/init-data'
import { useRouter, useSearchParams } from 'next/navigation'

interface Region {
  name: string
  area: string
  backendVersion: string
  frontendVersion: string
  targetVersion: string
  backendReady: boolean
  frontendReady: boolean
}

function RegionsPageContent() {
  const { regions, loading } = useRegions()
  const router = useRouter()
  const searchParams = useSearchParams()

  // 从 URL 读取筛选参数
  const [ringFilter, setRingFilter] = useState(searchParams.get('ring') || 'all')
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all')
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '')

  // 更新 URL 参数
  const updateURL = (params: Record<string, string>) => {
    const newParams = new URLSearchParams()
    Object.entries(params).forEach(([key, value]) => {
      if (value && value !== 'all') {
        newParams.set(key, value)
      }
    })
    const newURL = `/regions${newParams.toString() ? '?' + newParams.toString() : ''}`
    router.replace(newURL)
  }

  // 获取局点所属 Ring
  const getRegionRing = (regionName: string): string | null => {
    for (const [ringName, regionNames] of Object.entries(RINGS)) {
      if (regionNames.includes(regionName)) {
        return ringName
      }
    }
    return null
  }

  // 获取局点升级状态
  const getUpgradeStatus = (region: Region): 'upgraded' | 'upgrading' | 'pending' => {
    const { backendReady, frontendReady } = region

    if (backendReady && frontendReady) return 'upgraded'
    if (backendReady && !frontendReady) return 'upgrading'
    return 'pending'
  }

  // 筛选局点
  const filteredRegions = regions.filter(region => {
    // Ring 环筛选
    const regionRing = getRegionRing(region.name)
    const matchesRing = ringFilter === 'all' || regionRing === ringFilter

    // 状态筛选
    const upgradeStatus = getUpgradeStatus(region)
    const matchesStatus = statusFilter === 'all' || upgradeStatus === statusFilter

    // 搜索筛选
    const matchesSearch = !searchQuery || region.name.toLowerCase().includes(searchQuery.toLowerCase())

    return matchesRing && matchesStatus && matchesSearch
  })

  const handleClearFilters = () => {
    setRingFilter('all')
    setStatusFilter('all')
    setSearchQuery('')
    updateURL({})
  }

  const hasActiveFilters = ringFilter !== 'all' || statusFilter !== 'all' || searchQuery

  // 处理搜索输入
  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    updateURL({ ring: ringFilter, status: statusFilter, search: value })
  }

  // Ring 环选项
  const ringOptions = ['all', ...Object.keys(RINGS)]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold gradient-text">局点版本</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            全网局点升级状态总览（按 Ring 环分组）
          </p>
        </div>
      </div>

      {/* Filters */}
      <Card className="glass">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索局点..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-8 w-48"
              />
            </div>
            <Select
              value={ringFilter}
              onValueChange={(value) => {
                setRingFilter(value)
                updateURL({ ring: value, status: statusFilter, search: searchQuery })
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Ring 环" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部局点</SelectItem>
                {Object.keys(RINGS).map((ring: string) => (
                  <SelectItem key={ring} value={ring}>{ring}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={statusFilter}
              onValueChange={(value) => {
                setStatusFilter(value)
                updateURL({ ring: ringFilter, status: value, search: searchQuery })
              }}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="状态" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="upgraded">已升级</SelectItem>
                <SelectItem value="upgrading">升级中</SelectItem>
                <SelectItem value="pending">待升级</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={handleClearFilters}>
                清除筛选
              </Button>
            )}

            {/* Legend */}
            <div className="flex-1 flex items-center justify-end gap-4 text-xs">
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">后端</span>
                <span className="text-success">●</span>
                <span className="text-muted-foreground">已升级</span>
                <span className="text-muted-foreground">○</span>
                <span className="text-muted-foreground">待升级</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground">前端</span>
                <span className="text-success">●</span>
                <span className="text-muted-foreground">已升级</span>
                <span className="text-muted-foreground">○</span>
                <span className="text-muted-foreground">待升级</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Region Cards by Ring */}
      {filteredRegions.length === 0 ? (
        <Card className="glass">
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground mb-4">
              {hasActiveFilters ? '暂无符合条件的局点' : '暂无局点数据'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={handleClearFilters}>
                清除筛选条件
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Ring 0 - Ring 4 */}
          {Object.entries(RINGS).map(([ringName, regionNames]) => {
            const ringRegions = filteredRegions.filter(r => regionNames.includes(r.name))
            if (ringRegions.length === 0) return null

            return (
              <div key={ringName}>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Map className="h-4 w-4 text-primary" />
                  {ringName}
                  <span className="text-xs text-muted-foreground font-normal">
                    ({ringRegions.length} 个局点)
                  </span>
                </h2>

                <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {ringRegions.map((region) => {
                    const { backendReady, frontendReady, backendVersion, frontendVersion, targetVersion } = region

                    return (
                      <Card
                        key={region.name}
                        className={cn(
                          "hover:border-primary/50 transition-all",
                          backendReady && frontendReady && "border-success bg-success/5"
                        )}
                      >
                        <CardContent className="p-3">
                          {/* 局点名称 */}
                          <h3 className="text-sm font-medium mb-3 text-center">{region.name}</h3>

                          {/* 分隔线 */}
                          <div className="border-b border-border/50 mb-3"></div>

                          {/* 前端 */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2 text-xs mb-1">
                              <span className="text-muted-foreground">前端</span>
                              <span className={frontendReady ? 'text-success' : 'text-muted-foreground'}>
                                {frontendReady ? '●' : '○'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <span className="text-foreground">{frontendVersion || '未设置'}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-foreground">{targetVersion || '25.10'}</span>
                            </div>
                          </div>

                          {/* 后端 */}
                          <div>
                            <div className="flex items-center gap-2 text-xs mb-1">
                              <span className="text-muted-foreground">后端</span>
                              <span className={backendReady ? 'text-success' : 'text-muted-foreground'}>
                                {backendReady ? '●' : '○'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <span className="text-foreground">{backendVersion || '未设置'}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-foreground">{targetVersion || '25.10'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* 未分配的局点 */}
          {(() => {
            const unassignedRegions = filteredRegions.filter(region => {
              return !Object.values(RINGS).some(names => names.includes(region.name))
            })

            return unassignedRegions.length > 0 ? (
              <div>
                <h2 className="text-base font-semibold mb-3 flex items-center gap-2">
                  <Map className="h-4 w-4 text-muted-foreground" />
                  未分配 Ring
                  <span className="text-xs text-muted-foreground font-normal">
                    ({unassignedRegions.length} 个局点)
                  </span>
                </h2>

                <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {unassignedRegions.map((region) => {
                    const { backendReady, frontendReady, backendVersion, frontendVersion, targetVersion } = region

                    return (
                      <Card
                        key={region.name}
                        className={cn(
                          "hover:border-primary/50 transition-all",
                          backendReady && frontendReady && "border-success bg-success/5"
                        )}
                      >
                        <CardContent className="p-3">
                          {/* 局点名称 */}
                          <h3 className="text-sm font-medium mb-3 text-center">{region.name}</h3>

                          {/* 分隔线 */}
                          <div className="border-b border-border/50 mb-3"></div>

                          {/* 前端 */}
                          <div className="mb-3">
                            <div className="flex items-center gap-2 text-xs mb-1">
                              <span className="text-muted-foreground">前端</span>
                              <span className={frontendReady ? 'text-success' : 'text-muted-foreground'}>
                                {frontendReady ? '●' : '○'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <span className="text-foreground">{frontendVersion || '未设置'}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-foreground">{targetVersion || '25.10'}</span>
                            </div>
                          </div>

                          {/* 后端 */}
                          <div>
                            <div className="flex items-center gap-2 text-xs mb-1">
                              <span className="text-muted-foreground">后端</span>
                              <span className={backendReady ? 'text-success' : 'text-muted-foreground'}>
                                {backendReady ? '●' : '○'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono">
                              <span className="text-foreground">{backendVersion || '未设置'}</span>
                              <span className="text-muted-foreground">→</span>
                              <span className="text-foreground">{targetVersion || '25.10'}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>
              </div>
            ) : null
          })()}
        </>
      )}
    </div>
  )
}

export default function RegionsPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-full">加载中...</div>}>
      <RegionsPageContent />
    </Suspense>
  )
}
