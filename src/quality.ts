import { reactive } from 'vue'
import { findings } from './data'
export const ruleCatalog = [
  { id: 'TRACE-SQL-01', name: 'SQL 구조와 사용자 입력 분리', cwe: 'CWE-89', language: 'TypeScript', description: '외부 입력에서 SQL 실행까지의 경로와 파라미터 바인딩을 확인합니다.', findingId: 'TRC-001' },
  { id: 'TRACE-ACCESS-01', name: '객체 소유권과 접근 통제', cwe: 'CWE-639', language: 'TypeScript', description: '인증 사용자와 요청 객체의 관계 및 공통 인가 통제를 확인합니다.', findingId: 'TRC-002' },
] as const
export interface QualityDraft { maxHigh: number; maxUnreviewed: number; minimumCoverage: number; ruleIds: string[]; newCodeBase: string }
export const initialQuality: QualityDraft = { maxHigh: 0, maxUnreviewed: 0, minimumCoverage: 80, ruleIds: ruleCatalog.map(r => r.id), newCodeBase: '' }
export function normalizeQuality(value: unknown): QualityDraft {
  const v = value && typeof value === 'object' ? value as Partial<QualityDraft> : {}
  const integer = (n: unknown, fallback: number, max: number) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= max ? n : fallback
  return { maxHigh: integer(v.maxHigh, 0, 1000), maxUnreviewed: integer(v.maxUnreviewed, 0, 1000), minimumCoverage: integer(v.minimumCoverage, 80, 100), ruleIds: Array.isArray(v.ruleIds) ? [...new Set(v.ruleIds.filter(id => ruleCatalog.some(r => r.id === id)))] : [...initialQuality.ruleIds], newCodeBase: typeof v.newCodeBase === 'string' ? v.newCodeBase.replace(/[\u0000-\u001f\u007f]/g, '').slice(0,120) : '' }
}
function restore() { try { return normalizeQuality(JSON.parse(sessionStorage.getItem('trace-quality-draft') || 'null')) } catch { return normalizeQuality(null) } }
export const qualityDraft = reactive(restore())
export function saveQuality(value: QualityDraft) { Object.assign(qualityDraft, normalizeQuality(value)); try { sessionStorage.setItem('trace-quality-draft', JSON.stringify(qualityDraft)) } catch { /* Session storage is optional. */ } }
export interface GateMeasures { source: 'sample' | 'analysis'; high: number | null; unreviewed: number | null; coverage: number | null }
export function evaluateGate(measures: GateMeasures, conditions: QualityDraft): 'not-computed' | 'failed' | 'passed' {
  if (measures.source !== 'analysis' || [measures.high, measures.unreviewed, measures.coverage].some(v => v === null || !Number.isFinite(v) || v < 0) || measures.coverage! > 100) return 'not-computed'
  return measures.high! > conditions.maxHigh || measures.unreviewed! > conditions.maxUnreviewed || measures.coverage! < conditions.minimumCoverage ? 'failed' : 'passed'
}
export const evidenceFiles = [...new Set(findings.map(f => f.file.replace(/:\d+$/, '')))]
export function findingsInFile(file: string) { return findings.filter(f => f.file.replace(/:\d+$/, '') === file) }
export function sampleMeasures(): GateMeasures { return { source: 'sample', high: findings.filter(f => f.type === '취약 사례' && f.level === '높음').length, unreviewed: findings.filter(f => f.type === '확인 필요').length, coverage: null } }
