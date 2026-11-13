import { reactive } from 'vue'
import { normalizeRunContext } from './run-context'
import { ruleCatalog } from './quality'

export type DesignState = 'omitted' | 'provided' | 'partial'
export type ValidationState = 'pending' | 'passed' | 'failed'

export interface DemoRun {
  id: string
  createdAt: string
  design: DesignState
  documentName: string
  criterionIds: string[]
  step: number
  retryOf: string | null
  codeFailed: boolean
}
interface RuleRevision {
  ruleId: string
  version: number
  correction: string
  reason: string
  state: ValidationState
  createdAt: string
}
interface Workflow {
  runs: DemoRun[]
  selectedRunId: string
  revisions: RuleRevision[]
}

export const publicDesignDocument = '장바구니 조회 설계 v1.2 · 예제'
export const validationLabels: Record<ValidationState, string> = {
  pending: '자동 검증 대기', passed: '자동 검증 통과', failed: '자동 검증 실패',
}
const key = 'trace-v08-workflow'
const empty = (): Workflow => ({ runs: [], selectedRunId: '', revisions: [] })
const validDate = (value: unknown): value is string => typeof value === 'string' && Number.isFinite(Date.parse(value))
const validState = (value: unknown): value is ValidationState => value === 'pending' || value === 'passed' || value === 'failed'
const validDesign = (value: unknown): value is DesignState => value === 'omitted' || value === 'provided' || value === 'partial'
function restore(): Workflow {
  try {
    const input: Partial<Workflow> | null = JSON.parse(sessionStorage.getItem(key) || 'null')
    if (!input) return empty()
    const runs = (Array.isArray(input.runs) ? input.runs : []).filter(run =>
      run && /^RUN-\d+$/.test(run.id) && validDate(run.createdAt) && validDesign(run.design) &&
      Number.isInteger(run.step) && run.step >= 0 && run.step <= 4,
    ).map(run => ({
      ...run, ...normalizeRunContext(run), retryOf: typeof run.retryOf === 'string' && /^RUN-\d+$/.test(run.retryOf) ? run.retryOf : null, codeFailed: run.codeFailed === true,
    }))
    const revisions = (Array.isArray(input.revisions) ? input.revisions : []).filter(item =>
      item && ruleCatalog.some(rule => rule.id === item.ruleId) && validDate(item.createdAt) && validState(item.state) &&
      Number.isSafeInteger(item.version) && item.version > 1 && typeof item.correction === 'string' && typeof item.reason === 'string',
    ).map(item => ({ ...item, correction: item.correction.slice(0, 2000), reason: item.reason.slice(0, 500) }))
    return { runs, revisions, selectedRunId: typeof input.selectedRunId === 'string' ? input.selectedRunId : '' }
  } catch { return empty() }
}
export const workflow = reactive(restore())
function persist() {
  try { sessionStorage.setItem(key, JSON.stringify(workflow)) } catch { /* Keep the in-memory session available. */ }
}
export function runStatus(run: DemoRun) {
  if (run.codeFailed) return '코드 접근 실패'
  if (run.step < 4) return '진행 중'
  return run.design === 'partial' ? '부분 완료' : '완료'
}
export function runById(id: string) { return workflow.runs.find(run => run.id === id) }
export function selectedRun() {
  const run = runById(workflow.selectedRunId)
  return run && !run.codeFailed && run.step === 4 ? run : undefined
}
export function selectRun(run: DemoRun) {
  if (run.codeFailed || run.step < 4) return
  workflow.selectedRunId = run.id
  persist()
}
export function usePublicSample() {
  workflow.selectedRunId = ''
  persist()
}
export function createRun(input: { design: DesignState; documentName: string; criterionIds: string[] }, codeFailed = false, retryOf: string | null = null) {
  const number = Math.max(80, ...workflow.runs.map(run => Number(run.id.slice(4)))) + 1
  const run: DemoRun = {
    ...normalizeRunContext(input), id: `RUN-${number}`, createdAt: new Date().toISOString(),
    design: input.design, step: 0, codeFailed, retryOf,
  }
  workflow.runs.unshift(run)
  persist()
  return run.id
}
export function advanceRun(run: DemoRun) {
  if (run.codeFailed || run.step >= 4) return
  run.step += run.step === 0 && run.design === 'omitted' ? 2 : 1
  if (run.step === 4) selectRun(run)
  else persist()
}
export function latestRuleRevision(id: string) { return workflow.revisions.find(item => item.ruleId === id) }
export function requestRuleRevision(ruleId: string, correction: string, reason: string, state: ValidationState) {
  if (!ruleCatalog.some(rule => rule.id === ruleId) || !validState(state) || !correction.trim() || !reason.trim()) return false
  const version = (latestRuleRevision(ruleId)?.version ?? 1) + 1
  workflow.revisions.unshift({ ruleId, version, correction: correction.trim().slice(0, 2000), reason: reason.trim().slice(0, 500), state, createdAt: new Date().toISOString() })
  persist()
  return true
}
export const displayDate = (value: string) => new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul', dateStyle: 'short', timeStyle: 'short',
}).format(new Date(value))
