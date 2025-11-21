import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function parseVersionSegments(version: string): number[] {
  return version.split('.').map(Number)
}

export function compareVersions(a: string, b: string): number {
  const segA = parseVersionSegments(a)
  const segB = parseVersionSegments(b)
  const maxLen = Math.max(segA.length, segB.length)

  for (let i = 0; i < maxLen; i++) {
    const numA = segA[i] || 0
    const numB = segB[i] || 0
    if (numA !== numB) {
      return numA - numB
    }
  }
  return 0
}

export function isPatch(version: string): boolean {
  return version.split('.').length === 4
}

export function isRelease(version: string): boolean {
  return version.split('.').length === 3
}

export function getVersionDiff(current: string, baseline: string): 'aligned' | 'behind_one' | 'behind_many' | 'ahead' {
  const diff = compareVersions(current, baseline)
  if (diff === 0) return 'aligned'
  if (diff > 0) return 'ahead'

  const currentSegs = parseVersionSegments(current)
  const baselineSegs = parseVersionSegments(baseline)

  // Check how far behind
  if (currentSegs[0] !== baselineSegs[0] || currentSegs[1] !== baselineSegs[1]) {
    return 'behind_many'
  }

  const patchDiff = Math.abs((baselineSegs[2] || 0) - (currentSegs[2] || 0))
  return patchDiff <= 1 ? 'behind_one' : 'behind_many'
}
