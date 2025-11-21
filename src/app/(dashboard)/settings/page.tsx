'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, Save, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface SystemConfig {
  id: string
  key: string
  value: string
  updatedAt: string
}

export default function SettingsPage() {
  const [configs, setConfigs] = useState<SystemConfig[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Editable config state - use a map to support any version line
  const [baselineValues, setBaselineValues] = useState<Record<string, string>>({})
  const [activeVersionLines, setActiveVersionLines] = useState<string[]>([])
  const [newVersionLine, setNewVersionLine] = useState('')

  useEffect(() => {
    loadConfigs()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const loadConfigs = async () => {
    try {
      const res = await fetch('/api/config')
      const data = await res.json()
      if (data.success) {
        setConfigs(data.data.configs)

        // Parse configs
        const baselines: Record<string, string> = {}
        data.data.configs.forEach((config: SystemConfig) => {
          if (config.key.startsWith('baseline_')) {
            const versionLine = config.key.replace('baseline_', '')
            baselines[versionLine] = config.value
          } else if (config.key === 'active_version_lines') {
            setActiveVersionLines(JSON.parse(config.value))
          }
        })
        setBaselineValues(baselines)
      }
    } catch (error) {
      console.error('Error loading configs:', error)
      toast({
        variant: 'destructive',
        title: '加载失败',
        description: '无法加载系统配置',
      })
    } finally {
      setLoading(false)
    }
  }

  const saveConfig = async (key: string, value: string) => {
    setSaving(true)
    try {
      const res = await fetch('/api/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value }),
      })

      const data = await res.json()
      if (data.success) {
        toast({
          title: '保存成功',
          description: `已更新 ${key}`,
        })
        loadConfigs()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: '保存失败',
        description: error instanceof Error ? error.message : '保存配置失败',
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveBaseline = (versionLine: string, value: string) => {
    saveConfig(`baseline_${versionLine}`, value)
  }

  const handleAddVersionLine = () => {
    if (!newVersionLine) return

    const updated = [...activeVersionLines, newVersionLine]
    saveConfig('active_version_lines', JSON.stringify(updated))
    setNewVersionLine('')
  }

  const handleRemoveVersionLine = (versionLine: string) => {
    const updated = activeVersionLines.filter(vl => vl !== versionLine)
    saveConfig('active_version_lines', JSON.stringify(updated))
  }

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
      <div>
        <h1 className="text-3xl font-bold gradient-text">系统设置</h1>
        <p className="text-muted-foreground mt-1">
          管理基线版本和活跃版本线配置
        </p>
      </div>

      {/* Active Version Lines */}
      <Card className="glass">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            活跃版本线
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {activeVersionLines.map(vl => (
              <Badge
                key={vl}
                variant="outline"
                className="text-sm px-3 py-1 flex items-center gap-2"
              >
                {vl}.x
                <button
                  onClick={() => handleRemoveVersionLine(vl)}
                  className="hover:text-destructive"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="添加新版本线（如 25.12）"
              value={newVersionLine}
              onChange={(e) => setNewVersionLine(e.target.value)}
              className="max-w-xs"
            />
            <Button
              onClick={handleAddVersionLine}
              disabled={!newVersionLine || saving}
            >
              <Plus className="h-4 w-4 mr-2" />
              添加
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Baseline Configurations */}
      <div className="grid gap-6 md:grid-cols-2">
        {activeVersionLines.map(versionLine => {
          const key = `baseline_${versionLine}`
          const config = configs.find(c => c.key === key)
          const currentValue = baselineValues[versionLine] || ''

          return (
            <Card key={versionLine} className="glass">
              <CardHeader>
                <CardTitle className="text-lg">
                  {versionLine}.x 基线版本
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>基线版本号</Label>
                  <Input
                    placeholder={`如 ${versionLine}.0`}
                    value={currentValue}
                    onChange={(e) => {
                      setBaselineValues({
                        ...baselineValues,
                        [versionLine]: e.target.value
                      })
                    }}
                  />
                </div>

                <Button
                  onClick={() => handleSaveBaseline(versionLine, currentValue)}
                  disabled={saving}
                  className="w-full"
                >
                  <Save className="h-4 w-4 mr-2" />
                  保存基线
                </Button>

                {config && (
                  <p className="text-xs text-muted-foreground">
                    上次更新：{new Date(config.updatedAt).toLocaleString('zh-CN')}
                  </p>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* All Configs Table */}
      <Card className="glass">
        <CardHeader>
          <CardTitle>所有系统配置</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {configs.map(config => (
              <div
                key={config.id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-mono text-sm font-semibold">{config.key}</p>
                  <p className="text-sm text-muted-foreground">{config.value}</p>
                </div>
                <Badge variant="outline" className="text-xs">
                  {new Date(config.updatedAt).toLocaleDateString('zh-CN')}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
