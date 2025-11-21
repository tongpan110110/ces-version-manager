'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Settings, Save, Plus, Trash2 } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useConfigs } from '@/hooks/useLocalData'

interface SystemConfig {
  id: string
  key: string
  value: string
  updatedAt: string
}

export default function SettingsPage() {
  const { configs, updateConfig, loading } = useConfigs()
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  // Editable config state - use a map to support any version line
  const [baselineValues, setBaselineValues] = useState<Record<string, string>>({})
  const [activeVersionLines, setActiveVersionLines] = useState<string[]>([])
  const [newVersionLine, setNewVersionLine] = useState('')

  useEffect(() => {
    // Parse configs
    const baselines: Record<string, string> = {}
    Object.keys(configs).forEach((key) => {
      if (key.startsWith('baseline_')) {
        const versionLine = key.replace('baseline_', '')
        baselines[versionLine] = configs[key]
      } else if (key === 'active_version_lines') {
        setActiveVersionLines(JSON.parse(configs[key] || '[]'))
      }
    })
    setBaselineValues(baselines)
  }, [configs])

  const saveConfig = (key: string, value: string) => {
    setSaving(true)
    try {
      updateConfig(key, value)
      toast({
        title: '保存成功',
        description: `已更新 ${key}`,
      })
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
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">系统设置</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          管理目标版本和活跃版本线配置
        </p>
      </div>

      {/* Active Version Lines */}
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            活跃版本线
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pb-4">
          <div className="flex flex-wrap gap-1.5">
            {activeVersionLines.map(vl => (
              <Badge
                key={vl}
                variant="outline"
                className="text-xs px-2 py-0.5 flex items-center gap-1.5"
              >
                {vl}.x
                <button
                  onClick={() => handleRemoveVersionLine(vl)}
                  className="hover:text-destructive"
                >
                  <Trash2 className="h-2.5 w-2.5" />
                </button>
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <Input
              placeholder="添加新版本线（如 25.12）"
              value={newVersionLine}
              onChange={(e) => setNewVersionLine(e.target.value)}
              className="max-w-xs text-sm h-9"
            />
            <Button
              onClick={handleAddVersionLine}
              disabled={!newVersionLine || saving}
              size="sm"
            >
              <Plus className="h-3 w-3 mr-1.5" />
              添加
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Baseline Configurations */}
      <div className="grid gap-3 md:grid-cols-2">
        {activeVersionLines.map(versionLine => {
          const currentValue = baselineValues[versionLine] || ''

          return (
            <Card key={versionLine} className="glass">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  {versionLine}.x 目标版本
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 pb-4">
                <div className="space-y-1.5">
                  <Label className="text-xs">目标版本号</Label>
                  <Input
                    placeholder={`如 ${versionLine}.0`}
                    value={currentValue}
                    onChange={(e) => {
                      setBaselineValues({
                        ...baselineValues,
                        [versionLine]: e.target.value
                      })
                    }}
                    className="text-sm h-9"
                  />
                </div>

                <Button
                  onClick={() => handleSaveBaseline(versionLine, currentValue)}
                  disabled={saving}
                  className="w-full"
                  size="sm"
                >
                  <Save className="h-3 w-3 mr-1.5" />
                  保存目标版本
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* All Configs Table */}
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">所有系统配置</CardTitle>
        </CardHeader>
        <CardContent className="pb-4">
          <div className="space-y-1.5">
            {Object.entries(configs).map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50"
              >
                <div>
                  <p className="font-mono text-xs font-semibold">{key}</p>
                  <p className="text-xs text-muted-foreground">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
