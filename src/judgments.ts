export type JudgmentOutcome = 'violated' | 'satisfied' | 'needs-review' | 'unassessed'

export interface CriterionJudgment {
  id: string
  title: string
  outcome: JudgmentOutcome
  findingIds: readonly string[]
}

export interface JudgmentSnapshot {
  source: 'manual-sample' | 'analysis'
  scopeLabel: string
  // A complete inventory for this scope; pending judgments may still exist in it.
  inventoryComplete: boolean
  items: readonly CriterionJudgment[]
}

export const judgmentLabels: Record<JudgmentOutcome, string> = {
  violated: '위반', satisfied: '충족', 'needs-review': '확인 필요', unassessed: '미판정',
}

export function formatViolationRate(value: number | null): string {
  if (value === null || !Number.isFinite(value) || value < 0 || value > 100) return '—'
  if (value > 0 && value < 0.1) return '<0.1%'
  if (value > 99.9 && value < 100) return '>99.9%'
  return `${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value)}%`
}

// Explicit criterion-level manual records, separate from the finding list and profile selection.
// This closed set describes only these three public sample checks, never the whole codebase.
export const publicJudgmentSample: JudgmentSnapshot = {
  source: 'manual-sample',
  scopeLabel: '수동 판정 표본 · 전체 코드 결과 아님',
  inventoryComplete: true,
  items: [
    { id: 'TRACE-SQL-01', title: 'SQL 구조와 사용자 입력 분리', outcome: 'violated', findingIds: ['TRC-001'] },
    { id: 'TRACE-ACCESS-01', title: '객체 소유권과 접근 통제', outcome: 'violated', findingIds: ['TRC-002'] },
    { id: 'TRACE-POLICY-01', title: '관리자 예외 정책 확인', outcome: 'needs-review', findingIds: ['TRC-003'] },
  ],
}

export interface JudgmentSummary {
  available: boolean
  inventoryComplete: boolean
  items: CriterionJudgment[]
  total: number | null
  judged: number | null
  violated: number | null
  satisfied: number | null
  needsReview: number | null
  unassessed: number | null
  findings: number | null
  violationRate: number | null
}

export function summarizeJudgments(snapshot: JudgmentSnapshot | null): JudgmentSummary {
  if (!snapshot) return {
    available: false, inventoryComplete: false, items: [], total: null, judged: null,
    violated: null, satisfied: null, needsReview: null, unassessed: null, findings: null, violationRate: null,
  }

  // A violation at any location violates that criterion. It is satisfied only when no
  // violation, unresolved question or unassessed location remains in the supplied scope.
  const priority: Record<JudgmentOutcome, number> = { satisfied: 0, unassessed: 1, 'needs-review': 2, violated: 3 }
  const byId = new Map<string, CriterionJudgment>()
  const findingIds = new Set<string>()
  for (const item of snapshot.items) {
    const previous = byId.get(item.id)
    byId.set(item.id, previous ? {
      ...previous,
      outcome: priority[item.outcome] > priority[previous.outcome] ? item.outcome : previous.outcome,
      findingIds: [...new Set([...previous.findingIds, ...item.findingIds])],
    } : { ...item, findingIds: [...new Set(item.findingIds)] })
    // Questions linked to a criterion never become confirmed code findings through merging.
    if (item.outcome === 'violated') item.findingIds.forEach(id => findingIds.add(id))
  }

  const items = [...byId.values()]
  const count = (outcome: JudgmentOutcome) => items.filter(item => item.outcome === outcome).length
  const violated = count('violated'), satisfied = count('satisfied'), judged = violated + satisfied
  return {
    available: true, inventoryComplete: snapshot.inventoryComplete, items, total: items.length,
    judged, violated, satisfied, needsReview: count('needs-review'), unassessed: count('unassessed'),
    findings: findingIds.size,
    violationRate: snapshot.inventoryComplete && judged > 0 ? violated / judged * 100 : null,
  }
}
