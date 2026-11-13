import { describe, expect, it } from 'vitest'
import { findings } from './data'
import { publicJudgmentSample } from './judgments'
import { buildReportModel } from './report-model'
import { reportMarkdown } from './domain'
import { buildPdfReportFromModel } from './report-pdf'

const sample = () => buildReportModel(findings, 'v19.0.0', false, {judgmentSnapshot:publicJudgmentSample})
describe('요약·상세 보고서의 공통 근거', () => {
  it('기준별 위반과 발견을 구분하고 질문을 등급 결정 원인에 더하지 않는다', () => {
    const report = sample()
    expect(report.assessment.grade).toBe('D')
    expect(report.rateLabel).toBe('100%')
    expect(report.summary).toMatchObject({total:3,judged:2,violated:2,needsReview:1,findings:2})
    expect(report.causes.map(item => item.id)).toEqual(['TRC-001','TRC-002'])
    expect(report.questions.map(item => item.id)).toEqual(['TRC-003'])
  })
  it('현재 범위 밖의 발견과 중복 발견을 상세·근거 파일 수에 추가하지 않는다', () => {
    const report = buildReportModel([...findings,findings[0],{...findings[0],id:'outside',file:'other.ts:1'}], 'v19.0.0', false, {judgmentSnapshot:publicJudgmentSample})
    expect(report.confirmed).toHaveLength(2)
    expect(report.scopeEntries.find(entry => entry.label === '참고한 근거 파일')?.value).toBe('2개 · routes/login.ts, routes/basket.ts')
  })
  it('보고서 생성 후 원본 선택·흐름·판정이 바뀌어도 출력은 생성 시점의 자료를 유지한다', () => {
    const items = structuredClone(findings), snapshot = structuredClone(publicJudgmentSample), criterionIds=['CR-001']
    const report = buildReportModel(items,'v19.0.0',true,{judgmentSnapshot:snapshot,criterionIds,documentName:'설계.md'})
    items[0].flow[0].detail='changed'; snapshot.items[0].outcome='satisfied'; criterionIds.length=0
    expect(report.confirmed[0].flow[0].detail).not.toBe('changed')
    expect(report.summary.violated).toBe(2)
    expect(report.selectedCriteria.map(item => item.id)).toEqual(['CR-001'])
  })
  it.each([null,{...publicJudgmentSample,inventoryComplete:false},{...publicJudgmentSample,items:[]}])('판정 자료가 없거나 불완전·0개이면 비율과 등급을 생성하지 않는다', snapshot => {
    const report=buildReportModel([], '', false, {judgmentSnapshot:snapshot})
    expect(report.assessment.grade).toBeNull()
    expect(report.rateLabel).toBe('—')
  })
  it('웹의 모델과 PDF·Markdown이 같은 흐름·영향·미수행 상태·선택 규정을 내보낸다', () => {
    const report=buildReportModel(findings,'v19.0.0',true,{judgmentSnapshot:publicJudgmentSample,criterionIds:['CR-001','unknown']})
    const outputs=[JSON.stringify(buildPdfReportFromModel(report).content),reportMarkdown(report)]
    for(const output of outputs) for(const value of ['인증 우회 가능성','req.body.email','sequelize.query','실행 재현','미수행','CR-001','실제 사내 규정 아님','전체 코드 결과 아님']) expect(output).toContain(value)
    expect(report.selectedCriteria).toHaveLength(1)
  })
})
