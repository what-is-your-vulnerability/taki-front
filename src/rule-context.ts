import type { LocationQuery, LocationQueryRaw } from 'vue-router'
import { getCriterion } from './policies'
import { ruleCatalog } from './quality'

export function ruleContext(query: LocationQuery) {
  const criterion = getCriterion(typeof query.criterion === 'string' ? query.criterion : '')
  const rule = ruleCatalog.find(item => item.id === query.rule) || ruleCatalog[criterion ? 1 : 0]
  const parsed = Number(query.version)
  const version = Number.isSafeInteger(parsed) && parsed >= 1 ? parsed : 1
  return { rule, version, criterion }
}
export function ruleQuery(rule: string, version = 1, criterion?: string): LocationQueryRaw {
  return { rule, version: String(version), ...(criterion ? { criterion } : {}) }
}
export function ruleCasesTarget(rule: string, version = 1, criterion?: string) {
  return { path: '/rules', query: { tab: 'cases', ...ruleQuery(rule, version, criterion) } }
}
