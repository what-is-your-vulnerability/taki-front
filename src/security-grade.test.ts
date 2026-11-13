import { describe, expect, it } from 'vitest'
import { findings } from './data'
import { publicJudgmentSample, type JudgmentSnapshot } from './judgments'
import { assessSecurityGrade, matchesGrade, securityGrade } from './security-grade'

const snapshot = (level: string): JudgmentSnapshot => ({ source: 'analysis', scopeLabel: '테스트', inventoryComplete: true, items: [{ id: 'rule', title: '규칙', outcome: 'violated', findingIds: [level] }] })
describe('보안 등급과 필터', () => {
  it('확정 취약점의 최고 위험도를 A–E로 분류한다', () => {
    for (const [level, grade] of [['정보','A'],['낮음','B'],['중간','C'],['높음','D'],['차단 수준','E']]) {
      expect(securityGrade(snapshot(level), [{ id: level, type: '취약 사례', level }])).toBe(grade)
    }
    expect(securityGrade({ ...snapshot('높음'), items: [...snapshot('높음').items, ...snapshot('차단 수준').items.map(item => ({ ...item, id: 'second' }))] }, [
      { id: '높음', type: '취약 사례', level: '높음' }, { id: '차단 수준', type: '취약 사례', level: '차단 수준' },
    ])).toBe('E')
  })
  it('충족 판정이 있고 확정 취약점이 없을 때만 A를 제공한다', () => {
    expect(securityGrade({ ...snapshot(''), items: [{ id: 'pass', title: '규칙', outcome: 'satisfied', findingIds: [] }] }, [])).toBe('A')
    expect(securityGrade({ ...snapshot(''), items: [] }, [])).toBeNull()
  })
  it('확인 질문은 제외하고 공개 표본의 높은 위험 2건을 D로 분류한다', () => {
    expect(securityGrade(publicJudgmentSample, findings.map(item => item.type === '확인 필요' ? { ...item, level: '차단 수준' } : item))).toBe('D')
  })
  it('분석 부재·부분 수집·미판정·근거 누락·알 수 없는 위험도를 미측정으로 둔다', () => {
    expect(securityGrade(null, [])).toBeNull()
    expect(securityGrade({ ...snapshot('높음'), inventoryComplete: false }, findings)).toBeNull()
    expect(securityGrade({ ...snapshot('높음'), items: [...snapshot('높음').items, { id: 'pending', title: '규칙', outcome: 'unassessed', findingIds: [] }] }, findings)).toBeNull()
    expect(securityGrade(snapshot('missing'), [])).toBeNull()
    expect(securityGrade(snapshot('unknown'), [{ id: 'unknown', type: '취약 사례', level: 'unknown' }])).toBeNull()
  })
  it('모든 등급과 미측정을 서로 구분하고 전체 조건에서는 모두 포함한다', () => {
    expect(matchesGrade('D', 'D')).toBe(true)
    expect(matchesGrade('D', 'A')).toBe(false)
    expect(matchesGrade(null, 'unmeasured')).toBe(true)
    expect(matchesGrade('D', 'unmeasured')).toBe(false)
    expect(matchesGrade(null, 'A')).toBe(false)
    expect(matchesGrade(null, 'all')).toBe(true)
  })
  it('등급을 결정한 최고 위험도 근거만 중복 없이 반환한다', () => {
    const linked: JudgmentSnapshot = { ...snapshot(''), items: [
      { id: 'violation', title: '위반', outcome: 'violated', findingIds: ['lower', 'high-1', 'high-2', 'high-1'] },
      { id: 'question', title: '질문', outcome: 'needs-review', findingIds: ['policy'] },
    ] }
    const items = [
      { id: 'lower', type: '취약 사례' as const, level: '중간' },
      { id: 'high-1', type: '취약 사례' as const, level: '높음' },
      { id: 'high-2', type: '취약 사례' as const, level: '높음' },
      { id: 'policy', type: '확인 필요' as const, level: '차단 수준' },
      { id: 'unlinked', type: '취약 사례' as const, level: '차단 수준' },
    ]
    expect(assessSecurityGrade(linked, items)).toEqual({ grade: 'D', determiningFindingIds: ['high-1', 'high-2'] })
    expect(assessSecurityGrade(linked, items.map(item => item.id === 'high-1' ? { ...item, level: '낮음' } : item))).toEqual({ grade: 'D', determiningFindingIds: ['high-2'] })
  })
  it('미측정과 A 등급을 취약점 때문인 것으로 설명하지 않는다', () => {
    expect(assessSecurityGrade(null, findings)).toEqual({ grade: null, determiningFindingIds: [] })
    expect(assessSecurityGrade({ ...snapshot(''), items: [{ id: 'pass', title: '규칙', outcome: 'satisfied', findingIds: [] }] }, [])).toEqual({ grade: 'A', determiningFindingIds: [] })
    expect(assessSecurityGrade(publicJudgmentSample, findings)).toEqual({ grade: 'D', determiningFindingIds: ['TRC-001', 'TRC-002'] })
  })
})
