import { describe, expect, it } from 'vitest'
import { findings } from './data'
import { formatViolationRate, publicJudgmentSample, summarizeJudgments, type CriterionJudgment, type JudgmentSnapshot } from './judgments'

const snapshot = (items: CriterionJudgment[], inventoryComplete = true): JudgmentSnapshot => ({ source: 'analysis', scopeLabel: '테스트 분석', inventoryComplete, items })

describe('기준별 판정과 코드 발견의 별도 집계', () => {
  it('작은 위반 비율을 0%로, 거의 전체인 비율을 100%로 반올림하지 않는다', () => {
    expect([null, 0, 25, 100 / 3, 0.01, 99.99, 100, NaN].map(formatViolationRate)).toEqual(['—', '0%', '25%', '33.3%', '<0.1%', '>99.9%', '100%', '—'])
  })
  it('판정 완료 기준만 분모로 사용하고 확인 필요·미판정은 제외한다', () => {
    const items: CriterionJudgment[] = [
      ...Array.from({ length: 6 }, (_, i) => ({ id: `fail-${i}`, title: '위반', outcome: 'violated' as const, findingIds: [`hit-${i}-a`, `hit-${i}-b`] })),
      ...Array.from({ length: 18 }, (_, i) => ({ id: `pass-${i}`, title: '충족', outcome: 'satisfied' as const, findingIds: [] })),
      ...Array.from({ length: 4 }, (_, i) => ({ id: `review-${i}`, title: '확인', outcome: 'needs-review' as const, findingIds: [`question-${i}`] })),
      { id: 'waiting', title: '미판정', outcome: 'unassessed', findingIds: [] },
    ]
    expect(summarizeJudgments(snapshot(items))).toMatchObject({ judged: 24, violated: 6, satisfied: 18, needsReview: 4, unassessed: 1, findings: 12, violationRate: 25 })
  })

  it('동일 기준은 한 번만 세고 코드 발견 ID도 중복 제거한다', () => {
    const result = summarizeJudgments(snapshot([
      { id: 'sql', title: 'SQL', outcome: 'satisfied', findingIds: [] },
      { id: 'sql', title: 'SQL', outcome: 'violated', findingIds: ['hit-a', 'hit-b'] },
      { id: 'sql', title: 'SQL', outcome: 'violated', findingIds: ['hit-b'] },
      { id: 'access', title: '접근 통제', outcome: 'violated', findingIds: ['hit-b', 'hit-c'] },
    ]))
    expect(result).toMatchObject({ total: 2, judged: 2, violated: 2, findings: 3, violationRate: 100 })
  })

  it('전체 집계가 없거나 일부 결과만 수집되면 비율을 만들지 않는다', () => {
    expect(summarizeJudgments(null)).toMatchObject({ available: false, judged: null, violated: null, findings: null, violationRate: null })
    expect(summarizeJudgments(snapshot([{ id: 'one', title: '일부 항목', outcome: 'violated', findingIds: ['hit'] }], false))).toMatchObject({ inventoryComplete: false, violationRate: null })
  })

  it('판정 완료가 0개면 비율을 보류하고, 실제 충족 판정이 있으면 위반율 0%를 계산한다', () => {
    expect(summarizeJudgments(snapshot([]))).toMatchObject({ judged: 0, violationRate: null })
    expect(summarizeJudgments(snapshot([{ id: 'question', title: '질문', outcome: 'needs-review', findingIds: ['question'] }]))).toMatchObject({ judged: 0, findings: 0, needsReview: 1, violationRate: null })
    expect(summarizeJudgments(snapshot([{ id: 'passed', title: '충족', outcome: 'satisfied', findingIds: [] }]))).toMatchObject({ judged: 1, violated: 0, violationRate: 0 })
  })

  it('공개 표본의 수동 기준 판정과 기존 발견 근거가 일치한다', () => {
    const result = summarizeJudgments(publicJudgmentSample)
    expect(publicJudgmentSample.source).toBe('manual-sample')
    expect(result).toMatchObject({ total: 3, judged: 2, violated: 2, satisfied: 0, needsReview: 1, findings: 2, violationRate: 100 })
    for (const item of publicJudgmentSample.items) {
      for (const id of item.findingIds) {
        const finding = findings.find(f => f.id === id)
        expect(finding).toBeDefined()
        expect(finding?.type).toBe(item.outcome === 'violated' ? '취약 사례' : '확인 필요')
      }
    }
  })
})
