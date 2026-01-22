/**
 * 初始化数据配置
 * 用于系统首次启动时的默认数据
 */

// Ring 分组定义 - 固定不变
export const RINGS: Record<string, string[]> = {
  'Ring 0': [
    '广州友好',
    '乌兰察布二零一',
    '乌兰察布二零二',
  ],
  'Ring 1': [
    '深圳',
    '布宜诺斯艾利斯',
    '利马一',
    '利雅得',
  ],
  'Ring 2': [
    '非洲-开罗',
    '土耳其-伊斯坦布尔',
    '拉美-墨西哥城一',
    '亚太-马尼拉',
    '亚太-雅加达',
    '华东二',
    '华北三',
    '汽车二',
  ],
  'Ring 3': [
    '西南-贵阳一',
    '华北-乌兰察布-汽车一',
    '华东-上海二',
    '非洲-约翰内斯堡',
    '俄罗斯-莫斯科二',
    '亚太-曼谷',
    '中国-香港',
    '拉美-圣地亚哥',
    '华北-北京二零一',
    '华北-乌兰察布二零七',
    '华东-芜湖二零一',
  ],
  'Ring 4': [
    '亚太-新加坡',
    '拉美-墨西哥城二',
    '华南-广州',
    '华北-北京一',
    '华北-北京四',
    '华北-北京二',
    '华北-乌兰察布一',
    '华东-上海一',
    '拉美-圣保罗一',
    '华南-东莞二零一',
    '西南-贵阳二零一',
  ],
}

// 局点初始化数据
export interface InitRegion {
  name: string
  area: string
  backendVersion: string
  frontendVersion: string
  targetVersion: string
  backendReady: boolean
  frontendReady: boolean
}

// 根据局点名称推断区域
function getAreaByName(name: string): string {
  if (name.includes('亚太') || name.includes('曼谷') || name.includes('新加坡') ||
      name.includes('雅加达') || name.includes('马尼拉') || name.includes('中国-香港')) {
    return 'apac'
  }
  if (name.includes('非洲') || name.includes('开罗') || name.includes('约翰内斯堡') ||
      name.includes('俄罗斯') || name.includes('莫斯科') || name.includes('土耳其') ||
      name.includes('伊斯坦布尔')) {
    return 'africa'
  }
  if (name.includes('拉美') || name.includes('利马') || name.includes('布宜诺斯艾利斯') ||
      name.includes('墨西哥') || name.includes('圣地亚哥') || name.includes('圣保罗')) {
    return 'latam'
  }
  return 'domestic'
}

// 生成所有局点的初始化数据
export function generateInitRegions(): InitRegion[] {
  const allRegionNames = Object.values(RINGS).flat()

  return allRegionNames.map((name) => {
    // 华北-北京一的后端版本是 25.8.3，其他都是 25.8.2
    const isBeijing1 = name === '华北-北京一'

    // 只有广州友好和乌兰察布二零一已升级完成
    const isUpgraded = name === '广州友好' || name === '乌兰察布二零一'

    return {
      name,
      area: getAreaByName(name),
      backendVersion: isBeijing1 ? '25.8.3' : '25.8.2',
      frontendVersion: '25.8.3.1',
      targetVersion: '25.10.0',
      backendReady: isUpgraded,
      frontendReady: isUpgraded,
    }
  })
}

// 系统配置初始化数据
export interface InitSystemConfig {
  key: string
  value: string
}

export const INIT_SYSTEM_CONFIGS: InitSystemConfig[] = [
  { key: 'baseline_25.8', value: '25.8.2' },
  { key: 'baseline_25.10', value: '25.10.0' },
  { key: 'active_version_lines', value: '["25.8", "25.10"]' },
]

// 获取所有初始化数据
export function getInitData() {
  return {
    rings: RINGS,
    regions: generateInitRegions(),
    systemConfigs: INIT_SYSTEM_CONFIGS,
  }
}
