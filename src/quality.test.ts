import { describe, it, expect } from 'vitest'
import { evaluateGate, normalizeQuality, sampleMeasures, initialQuality, evidenceFiles, findingsInFile } from './quality'
import { normalizeReviews } from './triage'
import { summarize } from './domain'
import { findings } from './data'
describe('측정 근거를 유지하는 프로젝트 화면', () => {
  it('공개 예제나 미측정 값으로 Gate 통과를 만들지 않는다', () => {
    expect(evaluateGate(sampleMeasures(), initialQuality)).toBe('not-computed')
    expect(evaluateGate({source:'analysis',high:0,unreviewed:0,coverage:null},initialQuality)).toBe('not-computed')
    expect(evaluateGate({source:'analysis',high:0,unreviewed:0,coverage:101},initialQuality)).toBe('not-computed')
  })
  it('실측 데이터가 있으면 조건 경계값을 포함해 평가한다', () => {
    expect(evaluateGate({source:'analysis',high:0,unreviewed:0,coverage:80},initialQuality)).toBe('passed')
    expect(evaluateGate({source:'analysis',high:1,unreviewed:0,coverage:100},initialQuality)).toBe('failed')
    expect(evaluateGate({source:'analysis',high:0,unreviewed:1,coverage:100},initialQuality)).toBe('failed')
    expect(evaluateGate({source:'analysis',high:0,unreviewed:0,coverage:79},initialQuality)).toBe('failed')
  })
  it('비정상 조건과 알 수 없는 규칙을 세션 복구에서 제거한다', () => {
    expect(normalizeQuality({maxHigh:-1,minimumCoverage:Infinity,ruleIds:['unknown','TRACE-SQL-01','TRACE-SQL-01']})).toMatchObject({maxHigh:0,minimumCoverage:80,ruleIds:['TRACE-SQL-01']})
  })
  it('파일별 발견을 중복 없이 연결하며 전체 저장소 파일 수를 추정하지 않는다', () => {
    expect(evidenceFiles).toHaveLength(2); expect(findingsInFile('routes/basket.ts').map(f=>f.id)).toEqual(['TRC-002','TRC-003']);expect(findingsInFile('unknown.ts')).toEqual([])
  })
  it('검토 메모를 남겨도 정책 질문을 취약점으로 바꾸지 않는다', () => {
    const restored=normalizeReviews({'TRC-003':{status:'recorded',note:'관리자 예외 정책 요청'},unknown:{status:'recorded',note:'x'}})
    expect(restored['TRC-003'].status).toBe('recorded');expect(restored.unknown).toBeUndefined();expect(summarize(findings)).toEqual({vulnerabilities:2,review:1})
    expect(normalizeReviews({'TRC-003':{status:'recorded',note:''}})['TRC-003'].status).toBe('unreviewed')
  })
})
