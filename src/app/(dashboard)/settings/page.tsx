'use client'

import { useState, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Upload, Download, Plus, Edit, Trash2, Settings } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// 类型定义
interface VersionLine {
  versionLine: string
  baseline: string
  active: boolean
}

interface Region {
  name: string
  area: string
  backendVersion: string
  frontendVersion: string
  targetVersion: string
  backendReady: boolean
  frontendReady: boolean
}

interface Component {
  name: string
  description: string
  type: 'frontend' | 'backend'
}

interface ImportData {
  versionLines?: VersionLine[]
  regions?: Region[]
  components?: Component[]
  plans?: any[]
}

export default function SettingsPage() {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [importType, setImportType] = useState<string>('')
  const [mounted, setMounted] = useState(false)

  // 模态框状态
  const [versionLineDialogOpen, setVersionLineDialogOpen] = useState(false)
  const [regionDialogOpen, setRegionDialogOpen] = useState(false)
  const [componentDialogOpen, setComponentDialogOpen] = useState(false)

  // 编辑状态
  const [editingVersionLine, setEditingVersionLine] = useState<VersionLine | null>(null)
  const [editingRegion, setEditingRegion] = useState<Region | null>(null)
  const [editingComponent, setEditingComponent] = useState<Component | null>(null)

  // 表单状态
  const [versionLineForm, setVersionLineForm] = useState({ versionLine: '', baseline: '', active: true })
  const [regionForm, setRegionForm] = useState({ name: '', area: '', backendVersion: '', frontendVersion: '', targetVersion: '', backendReady: false, frontendReady: false })
  const [componentForm, setComponentForm] = useState({ name: '', description: '', type: 'backend' as 'frontend' | 'backend' })

  // 数据状态（从 localStorage 读取，如果没有则用默认值）
  const [versionLines, setVersionLines] = useState<VersionLine[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('settings_versionLines')
      if (saved) return JSON.parse(saved)
    }
    return [
      { versionLine: '25.8', baseline: '25.8.2', active: true },
      { versionLine: '25.10', baseline: '25.10.0', active: true },
    ]
  })

  const [regions, setRegions] = useState<Region[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('settings_regions')
      if (saved) return JSON.parse(saved)
    }
    return []
  })

  const [components, setComponents] = useState<Component[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('settings_components')
      if (saved) return JSON.parse(saved)
    }
    return [
      { name: 'CES-Portal', description: '前端', type: 'frontend' },
      { name: 'ces-gateway', description: '网关服务', type: 'backend' },
      { name: 'ces-auth', description: '认证服务', type: 'backend' },
    ]
  })

  // 确保只在客户端挂载后渲染
  useEffect(() => {
    setMounted(true)
  }, [])

  // 当数据变化时自动保存到 localStorage
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('settings_versionLines', JSON.stringify(versionLines))
      localStorage.setItem('settings_regions', JSON.stringify(regions))
      localStorage.setItem('settings_components', JSON.stringify(components))
    }
  }, [versionLines, regions, components, mounted])

  if (!mounted) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-muted-foreground">加载中...</div>
      </div>
    )
  }

  // 保存到 localStorage
  const saveToLocalStorage = () => {
    localStorage.setItem('settings_versionLines', JSON.stringify(versionLines))
    localStorage.setItem('settings_regions', JSON.stringify(regions))
    localStorage.setItem('settings_components', JSON.stringify(components))
  }

  // JSON 导出
  const exportJson = (type: string) => {
    let data: any = {}
    let filename = ''

    switch (type) {
      case '版本线':
        data = { versionLines }
        filename = 'versionlines.json'
        break
      case '局点':
        data = { regions }
        filename = 'regions.json'
        break
      case '组件':
        data = { components }
        filename = 'components.json'
        break
      case '全部数据':
        data = { versionLines, regions, components }
        filename = 'all-data.json'
        break
    }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)

    toast({ title: '导出成功', description: `${filename} 已下载` })
  }

  // JSON 导入
  const importJson = (type: string) => {
    setImportType(type)
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string
        const data: ImportData = JSON.parse(content)

        let hasData = false
        switch (importType) {
          case '版本线':
            if (data.versionLines && Array.isArray(data.versionLines)) {
              setVersionLines(data.versionLines)
              hasData = true
            } else {
              toast({ variant: 'destructive', title: '导入失败', description: 'JSON 中缺少 versionLines 字段' })
              return
            }
            break
          case '局点':
            if (data.regions && Array.isArray(data.regions)) {
              setRegions(data.regions)
              hasData = true
            } else {
              toast({ variant: 'destructive', title: '导入失败', description: 'JSON 中缺少 regions 字段' })
              return
            }
            break
          case '组件':
            if (data.components && Array.isArray(data.components)) {
              setComponents(data.components)
              hasData = true
            } else {
              toast({ variant: 'destructive', title: '导入失败', description: 'JSON 中缺少 components 字段' })
              return
            }
            break
          case '全部数据':
            if (data.versionLines && Array.isArray(data.versionLines)) {
              setVersionLines(data.versionLines)
              hasData = true
            }
            if (data.regions && Array.isArray(data.regions)) {
              setRegions(data.regions)
              hasData = true
            }
            if (data.components && Array.isArray(data.components)) {
              setComponents(data.components)
              hasData = true
            }
            if (!hasData) {
              toast({ variant: 'destructive', title: '导入失败', description: 'JSON 中没有找到有效数据' })
              return
            }
            break
        }

        saveToLocalStorage()
        toast({ title: '导入成功', description: '数据已导入并保存' })
      } catch (error) {
        toast({
          variant: 'destructive',
          title: '导入失败',
          description: error instanceof Error ? error.message : 'JSON 格式错误',
        })
      }
    }
    reader.readAsText(file)

    // 重置 input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  // 版本线操作
  const openVersionLineDialog = (item?: VersionLine) => {
    if (item) {
      setEditingVersionLine(item)
      setVersionLineForm(item)
    } else {
      setEditingVersionLine(null)
      setVersionLineForm({ versionLine: '', baseline: '', active: true })
    }
    setVersionLineDialogOpen(true)
  }

  const saveVersionLine = () => {
    if (editingVersionLine) {
      setVersionLines(versionLines.map(vl => vl.versionLine === editingVersionLine.versionLine ? versionLineForm : vl))
    } else {
      setVersionLines([...versionLines, versionLineForm])
    }
    setVersionLineDialogOpen(false)
    toast({ title: '保存成功', description: '版本线配置已保存' })
  }

  const deleteVersionLine = (versionLine: string) => {
    setVersionLines(versionLines.filter(vl => vl.versionLine !== versionLine))
    toast({ title: '删除成功', description: '版本线已删除' })
  }

  // 局点操作
  const openRegionDialog = (item?: Region) => {
    if (item) {
      setEditingRegion(item)
      setRegionForm(item)
    } else {
      setEditingRegion(null)
      setRegionForm({ name: '', area: '', backendVersion: '', frontendVersion: '', targetVersion: '', backendReady: false, frontendReady: false })
    }
    setRegionDialogOpen(true)
  }

  const saveRegion = () => {
    if (editingRegion) {
      setRegions(regions.map(r => r.name === editingRegion.name ? regionForm : r))
    } else {
      setRegions([...regions, regionForm])
    }
    setRegionDialogOpen(false)
    toast({ title: '保存成功', description: '局点已保存' })
  }

  const deleteRegion = (name: string) => {
    setRegions(regions.filter(r => r.name !== name))
    toast({ title: '删除成功', description: '局点已删除' })
  }

  // 组件操作
  const openComponentDialog = (item?: Component) => {
    if (item) {
      setEditingComponent(item)
      setComponentForm(item)
    } else {
      setEditingComponent(null)
      setComponentForm({ name: '', description: '', type: 'backend' })
    }
    setComponentDialogOpen(true)
  }

  const saveComponent = () => {
    if (editingComponent) {
      setComponents(components.map(c => c.name === editingComponent.name ? componentForm : c))
    } else {
      setComponents([...components, componentForm])
    }
    setComponentDialogOpen(false)
    toast({ title: '保存成功', description: '组件已保存' })
  }

  const deleteComponent = (name: string) => {
    setComponents(components.filter(c => c.name !== name))
    toast({ title: '删除成功', description: '组件已删除' })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold gradient-text">系统设置</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          配置系统基础数据，支持 JSON 导入导出
        </p>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* 版本线配置 */}
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="h-4 w-4 text-primary" />
            版本线配置
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => importJson('版本线')}>
              <Upload className="h-3 w-3 mr-1" />
              导入
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportJson('版本线')}>
              <Download className="h-3 w-3 mr-1" />
              导出
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>版本线</TableHead>
                <TableHead>目标版本</TableHead>
                <TableHead>状态</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {versionLines.map((vl) => (
                <TableRow key={vl.versionLine}>
                  <TableCell className="font-mono">{vl.versionLine}.x</TableCell>
                  <TableCell className="font-mono">{vl.baseline || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={vl.active ? 'success' : 'secondary'}>
                      {vl.active ? '启用' : '禁用'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openVersionLineDialog(vl)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteVersionLine(vl.versionLine)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button className="mt-4" size="sm" onClick={() => openVersionLineDialog()}>
            <Plus className="h-3 w-3 mr-1" />
            添加版本线
          </Button>
        </CardContent>
      </Card>

      {/* 局点管理 */}
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">局点管理</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => importJson('局点')}>
              <Upload className="h-3 w-3 mr-1" />
              导入
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportJson('局点')}>
              <Download className="h-3 w-3 mr-1" />
              导出
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>局点</TableHead>
                <TableHead>区域</TableHead>
                <TableHead>当前版本</TableHead>
                <TableHead>目标版本</TableHead>
                <TableHead>后端</TableHead>
                <TableHead>前端</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {regions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground text-sm">
                    暂无局点数据，请通过 JSON 导入或手动添加
                  </TableCell>
                </TableRow>
              ) : (
                regions.map((region) => (
                  <TableRow key={region.name}>
                    <TableCell>{region.name}</TableCell>
                    <TableCell>{region.area === 'domestic' ? '国内' : region.area === 'apac' ? '亚太/中东' : region.area === 'africa' ? '非洲' : region.area === 'latam' ? '拉美' : region.area}</TableCell>
                    <TableCell className="font-mono text-xs">
                      <div className="flex flex-col gap-1">
                        <span>后端: {region.backendVersion || '-'}</span>
                        <span>前端: {region.frontendVersion || '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-primary">
                      {region.targetVersion || '-'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={region.backendReady ? 'success' : 'secondary'}>
                        {region.backendReady ? '●' : '○'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={region.frontendReady ? 'success' : 'secondary'}>
                        {region.frontendReady ? '●' : '○'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => openRegionDialog(region)}>
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => deleteRegion(region.name)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <Button className="mt-4" size="sm" onClick={() => openRegionDialog()}>
            <Plus className="h-3 w-3 mr-1" />
            添加局点
          </Button>
        </CardContent>
      </Card>

      {/* 组件管理 */}
      <Card className="glass">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">组件管理</CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => importJson('组件')}>
              <Upload className="h-3 w-3 mr-1" />
              导入
            </Button>
            <Button variant="outline" size="sm" onClick={() => exportJson('组件')}>
              <Download className="h-3 w-3 mr-1" />
              导出
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>组件名称</TableHead>
                <TableHead>说明</TableHead>
                <TableHead>类型</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {components.map((component) => (
                <TableRow key={component.name}>
                  <TableCell className="font-mono">{component.name}</TableCell>
                  <TableCell>{component.description}</TableCell>
                  <TableCell>
                    <Badge variant={component.type === 'frontend' ? 'secondary' : 'outline'}>
                      {component.type === 'frontend' ? '前端' : '后端'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => openComponentDialog(component)}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => deleteComponent(component.name)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <Button className="mt-4" size="sm" onClick={() => openComponentDialog()}>
            <Plus className="h-3 w-3 mr-1" />
            添加组件
          </Button>
        </CardContent>
      </Card>

      {/* 全量数据管理 */}
      <Card className="glass">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">全量数据管理</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => exportJson('全部数据')}>
              <Download className="h-4 w-4 mr-2" />
              导出全部数据
            </Button>
            <Button variant="outline" onClick={() => importJson('全部数据')}>
              <Upload className="h-4 w-4 mr-2" />
              导入全部数据
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            注意：导入全部数据会覆盖现有数据，请谨慎操作
          </p>
        </CardContent>
      </Card>

      {/* 版本线编辑弹窗 */}
      <Dialog open={versionLineDialogOpen} onOpenChange={setVersionLineDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingVersionLine ? '编辑版本线' : '添加版本线'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>版本线</Label>
              <Input
                placeholder="如 25.8"
                value={versionLineForm.versionLine}
                onChange={(e) => setVersionLineForm({ ...versionLineForm, versionLine: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>目标版本</Label>
              <Input
                placeholder="如 25.8.2"
                value={versionLineForm.baseline}
                onChange={(e) => setVersionLineForm({ ...versionLineForm, baseline: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setVersionLineDialogOpen(false)}>取消</Button>
            <Button onClick={saveVersionLine}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 局点编辑弹窗 */}
      <Dialog open={regionDialogOpen} onOpenChange={setRegionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRegion ? '编辑局点' : '添加局点'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>局点名称</Label>
              <Input
                placeholder="如 北京"
                value={regionForm.name}
                onChange={(e) => setRegionForm({ ...regionForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>区域</Label>
              <Select value={regionForm.area} onValueChange={(value) => setRegionForm({ ...regionForm, area: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择区域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="domestic">国内</SelectItem>
                  <SelectItem value="apac">亚太/中东</SelectItem>
                  <SelectItem value="africa">非洲</SelectItem>
                  <SelectItem value="latam">拉美</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>后端版本</Label>
              <Input
                placeholder="如 25.8.2"
                value={regionForm.backendVersion}
                onChange={(e) => setRegionForm({ ...regionForm, backendVersion: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>前端版本</Label>
              <Input
                placeholder="如 25.8.3.1"
                value={regionForm.frontendVersion}
                onChange={(e) => setRegionForm({ ...regionForm, frontendVersion: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>目标版本</Label>
              <Input
                placeholder="如 25.10.0"
                value={regionForm.targetVersion}
                onChange={(e) => setRegionForm({ ...regionForm, targetVersion: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRegionDialogOpen(false)}>取消</Button>
            <Button onClick={saveRegion}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 组件编辑弹窗 */}
      <Dialog open={componentDialogOpen} onOpenChange={setComponentDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingComponent ? '编辑组件' : '添加组件'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>组件名称</Label>
              <Input
                placeholder="如 ces-gateway"
                value={componentForm.name}
                onChange={(e) => setComponentForm({ ...componentForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>说明</Label>
              <Input
                placeholder="如 网关服务"
                value={componentForm.description}
                onChange={(e) => setComponentForm({ ...componentForm, description: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>类型</Label>
              <Select value={componentForm.type} onValueChange={(value: 'frontend' | 'backend') => setComponentForm({ ...componentForm, type: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="frontend">前端</SelectItem>
                  <SelectItem value="backend">后端</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setComponentDialogOpen(false)}>取消</Button>
            <Button onClick={saveComponent}>保存</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
