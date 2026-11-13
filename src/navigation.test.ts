import { beforeEach, describe, expect, it } from 'vitest'
import { advanceRun, createRun, runById, workflow } from './workflow'
import { clearFindingsOrigin, findingsReturnPosition, findingsReturnTarget, rememberFindings, resolveRequestedRun, resultManagementTarget, runQuery, withRunTarget } from './navigation'
import { defaultFindingFilters, readFindingFilters, writeFindingFilters } from './finding-filters'
import { ruleCasesTarget, ruleContext } from './rule-context'

beforeEach(() => { Object.assign(workflow, { runs: [], selectedRunId: '', revisions: [] }); clearFindingsOrigin() })
const completed = () => {
  const run = runById(createRun({ design: 'omitted', documentName: '', criterionIds: [] }))!
  for(let i=0;i<4;i++)advanceRun(run)
  return run
}
describe('결과 이동의 실행과 목록 맥락', () => {
  it('기존 결과 관리 주소는 실행 식별을 유지한 리포트 관리 영역으로 이동한다', () => {
    expect(resultManagementTarget({run:'RUN-81',at:'timestamp'})).toEqual({path:'/report',query:{run:'RUN-81',at:'timestamp',panel:'management'}})
  })
  it('결과 링크에 실행 ID·생성 시각을 담고 명시한 실행은 덮어쓰지 않는다', () => {
    const run=completed()
    const target=withRunTarget({path:'/findings',query:{type:'review'}})
    expect(target).toEqual({path:'/findings',query:{type:'review',...runQuery(run)}})
    expect(String(withRunTarget('/report'))).toContain(`run=${run.id}`)
    expect(String(withRunTarget('/results'))).toContain(`run=${run.id}`)
    expect(withRunTarget('/report?run=other&at=old')).toBe('/report?run=other&at=old')
    expect(withRunTarget('/rules')).toBe('/rules')
  })
  it('동일 ID라도 생성 시각이 다른 실행이나 없는 실행을 표본으로 대체하지 않는다', () => {
    const run=completed()
    expect(resolveRequestedRun({run:run.id,at:run.createdAt}).run?.id).toBe(run.id)
    expect(resolveRequestedRun({run:run.id,at:'other-tab'}).unavailable).toBe(true)
    expect(resolveRequestedRun({run:'missing'}).unavailable).toBe(true)
    expect(resolveRequestedRun({run:[run.id,'other']} ).unavailable).toBe(true)
    expect(resolveRequestedRun({}).requested).toBe(false)
  })
  it('목록 복귀 경로·스크롤은 해당 실행에만 재사용한다', () => {
    const query={run:'RUN-81',at:'timestamp'}
    rememberFindings('/findings?run=RUN-81&at=timestamp&q=basket',query,420,'TRC-002')
    expect(findingsReturnTarget(query)).toContain('q=basket')
    expect(findingsReturnPosition(query)).toEqual({top:420,id:'TRC-002'})
    expect(findingsReturnPosition({...query,at:'different'})).toEqual({top:0,id:''})
  })
})
describe('검색 조건과 Rule 대상', () => {
  it('필터 URL 왕복과 초기화에서 실행 식별 정보는 유지한다', () => {
    const initial={run:'RUN-81',at:'stamp'}
    const filters={query:'장바구니',kind:'vulnerability',cwe:'CWE-639',file:'routes/basket.ts',sort:'id'}
    const url=writeFindingFilters(initial,filters)
    expect(readFindingFilters(url as any,['CWE-639'],['routes/basket.ts'])).toEqual(filters)
    expect(writeFindingFilters(url as any,defaultFindingFilters)).toEqual(initial)
  })
  it('잘못된·배열 필터는 전체 조건으로 복구한다', () => {
    expect(readFindingFilters({q:['one','two'],type:'invalid',cwe:'CWE-other',file:'unknown',sort:'bad'},[],[])).toEqual(defaultFindingFilters)
  })
  it('ACCESS Rule과 요청 버전이 사례까지 유지된다', () => {
    const target=ruleCasesTarget('TRACE-ACCESS-01',2)
    const context=ruleContext(target.query)
    expect(context.rule.id).toBe('TRACE-ACCESS-01')
    expect(context.version).toBe(2)
    expect(ruleContext({criterion:'CR-001'}).rule.id).toBe('TRACE-ACCESS-01')
    expect(ruleContext({rule:'TRACE-SQL-01',version:'-1'}).version).toBe(1)
  })
})
