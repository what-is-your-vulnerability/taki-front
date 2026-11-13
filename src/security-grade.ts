import type { Finding } from './data'
import { summarizeJudgments, type JudgmentSnapshot } from './judgments'

export const securityGrades = ['A', 'B', 'C', 'D', 'E'] as const
export type SecurityGrade = typeof securityGrades[number]
export type GradeFilter = 'all' | SecurityGrade | 'unmeasured'
export const gradeDescriptions: Record<SecurityGrade, string> = {
  A: '없음·정보 수준', B: '낮음', C: '중간', D: '높음', E: '차단 수준',
}
export interface SecurityGradeAssessment {
  grade: SecurityGrade | null
  determiningFindingIds: string[]
}

// Adapted from Sonar's MQR security rating: the worst confirmed impact wins.
// A manual sample rates only that sample, never the entire service.
export function assessSecurityGrade(snapshot: JudgmentSnapshot | null, findings: readonly Pick<Finding, 'id' | 'type' | 'level'>[]): SecurityGradeAssessment {
  const unmeasured: SecurityGradeAssessment = { grade: null, determiningFindingIds: [] }
  const summary = summarizeJudgments(snapshot)
  if (!summary.inventoryComplete || !summary.judged || summary.unassessed) return unmeasured
  const violations = snapshot!.items.filter(item => item.outcome === 'violated')
  if (violations.some(item => !item.findingIds.length)) return unmeasured
  const ids = new Set(violations.flatMap(item => [...item.findingIds]))
  const rank: Record<string, number> = { '정보': 0, '낮음': 1, '중간': 2, '높음': 3, '차단 수준': 4 }
  const confirmed: { id: string; rank: number }[] = []
  let worst = 0
  for (const id of ids) {
    const finding = findings.find(item => item.id === id && item.type === '취약 사례')
    if (!finding || !Object.hasOwn(rank, finding.level)) return unmeasured
    worst = Math.max(worst, rank[finding.level])
    confirmed.push({ id, rank: rank[finding.level] })
  }
  return {
    grade: securityGrades[worst],
    // Only the worst confirmed findings determine a grade below A. Review questions,
    // less severe findings, and findings outside the snapshot are not grade causes.
    determiningFindingIds: worst > 0 ? confirmed.filter(item => item.rank === worst).map(item => item.id) : [],
  }
}

export const securityGrade = (snapshot: JudgmentSnapshot | null, findings: readonly Pick<Finding, 'id' | 'type' | 'level'>[]) => assessSecurityGrade(snapshot, findings).grade

export const matchesGrade = (grade: SecurityGrade | null, filter: GradeFilter) => filter === 'all' || (grade ?? 'unmeasured') === filter
