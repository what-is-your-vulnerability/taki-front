import { beforeEach, describe, expect, it } from 'vitest'
import { currentReport } from './report-context'
import { advanceRun, createRun, latestRuleRevision, requestRuleRevision, runById, runStatus, selectedRun, selectRun, workflow } from './workflow'

describe('v0.8 실행과 Rule 보완 시연', () => {
  beforeEach(() => Object.assign(workflow, { runs: [], selectedRunId: '', revisions: [] }))

  it('코드 접근 실패는 결과를 만들지 않고 재시도를 별도 실행에 기록한다', () => {
    const original = runById(createRun({ design: 'omitted', documentName: '', criterionIds: [] }, true))!
    advanceRun(original)
    selectRun(original)
    expect(original.step).toBe(0)
    expect(selectedRun()).toBeUndefined()
    const retry = runById(createRun(original, false, original.id))!
    expect(retry.id).not.toBe(original.id)
    expect(retry.retryOf).toBe(original.id)
    advanceRun(retry)
    expect(retry.step).toBe(2)
    advanceRun(retry)
    advanceRun(retry)
    expect(selectedRun()?.id).toBe(retry.id)
    expect(runStatus(original)).toBe('코드 접근 실패')
    expect(runStatus(retry)).toBe('완료')
  })

  it('부분 완료 결과와 과거 실행의 입력을 별개로 보존한다', () => {
    const partial = runById(createRun({ design: 'partial', documentName: '설계 v2', criterionIds: ['CR-001'] }))!
    for (let i = 0; i < 4; i++) advanceRun(partial)
    const report = currentReport()
    expect(runStatus(partial)).toBe('부분 완료')
    expect(report.scopeEntries.find(item => item.label === '설계문서')?.value).toContain('설계 v2')
    const next = runById(createRun({ design: 'omitted', documentName: '', criterionIds: [] }))!
    for (let i = 0; i < 4; i++) advanceRun(next)
    expect(currentReport().selectedCriteria).toHaveLength(0)
    selectRun(partial)
    expect(currentReport().selectedCriteria.map(item => item.id)).toEqual(['CR-001'])
    expect(currentReport().assessment).toEqual(report.assessment)
  })

  it('Rule 보완본이 기존 등급이나 증거를 덮어쓰지 않는다', () => {
    const issued = new Date('2026-11-10T00:00:00Z')
    const before = currentReport(issued)
    expect(requestRuleRevision('TRACE-ACCESS-01', ' ', '사유', 'failed')).toBe(false)
    for (const state of ['pending', 'passed', 'failed'] as const) {
      expect(requestRuleRevision('TRACE-ACCESS-01', '소유 관계 확인', '업무 범위 구분', state)).toBe(true)
      expect(latestRuleRevision('TRACE-ACCESS-01')?.state).toBe(state)
    }
    expect(workflow.revisions.map(item => item.version)).toEqual([4, 3, 2])
    expect(currentReport(issued)).toEqual(before)
  })
})
