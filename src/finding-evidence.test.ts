import { afterEach, describe, expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { findings } from './data'
import { currentReport } from './report-context'
import { runContext } from './run-context'
import { Detail } from './screens/Detail'
import { Report } from './screens/Report'
import { buildPdfReportFromModel } from './report-pdf'
import { reportMarkdown } from './domain'

const selectedBefore = [...runContext.criterionIds]
afterEach(() => {runContext.criterionIds = [...selectedBefore]})
const escape = (text: string) => text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
describe('이슈 상세와 리포트의 실제 표시 내용', () => {
  it('요약을 먼저 표시하고 상세는 접어도 PDF·Markdown에 모든 근거를 보존한다', async () => {
    const html = await renderToString(createSSRApp(Report))
    const report = currentReport()
    const disclosures = (html.match(/<details\b[^>]*>/g) || []).filter(tag => /class="[^"]*\breport-disclosure\b/.test(tag))
    expect(disclosures).toHaveLength(report.confirmed.length + report.questions.length)
    expect(disclosures.every(tag => !/\sopen(?:\s|=|>)/.test(tag))).toBe(true)
    expect(html.indexOf('id="report-summary"')).toBeLessThan(html.indexOf('<details'))
    const pdf = JSON.stringify(buildPdfReportFromModel(report).content)
    const markdown = reportMarkdown(report)
    for (const item of [...report.confirmed, ...report.questions]) {
      expect(html).toContain(`id="detail-${item.id}"`)
      for (const output of [pdf, markdown]) {
        for (const value of [item.id, item.file, item.impact, ...item.flow.map(step => step.detail)]) expect(output).toContain(value)
      }
    }
    expect(pdf).toContain('"text":"D"')
    expect(pdf).toContain('표본 기준')
  })
  it.each(findings)('$id의 흐름·영향·검증 수준·통제 관찰이 두 화면에서 일치한다', async finding => {
    const detail = await renderToString(createSSRApp({render:()=>h(Detail,{finding,go:()=>{}})}))
    const report = await renderToString(createSSRApp(Report))
    for (const value of [finding.input,finding.sink,finding.impact,...finding.flow.flatMap(step=>[step.title,step.detail]),...finding.controls.map(control=>control.detail),...currentReport().verification.map(state=>state.value)]) {
      expect(detail).toContain(escape(value))
      expect(report).toContain(escape(value))
    }
    expect(detail).toContain('표본 기준')
    expect(detail).toContain('전체 코드 결과 아님')
    expect(currentReport().assessment.grade).toBe('D')
    expect(detail).toContain(finding.type==='확인 필요' ? '등급에서 제외' : '등급 결정에 포함')
    expect(detail).not.toContain('danger-node')
    expect(detail).not.toContain('type="checkbox"')
  })
  it('선택한 사용자 규정만 같은 발견에 연결하며 적용 완료로 표현하지 않는다', async () => {
    runContext.criterionIds=['CR-001']
    const detail = await renderToString(createSSRApp({render:()=>h(Detail,{finding:findings[1],go:()=>{}})}))
    const report = await renderToString(createSSRApp(Report))
    for (const output of [detail,report]) {
      expect(output).toContain('CR-001')
      expect(output).not.toContain('CR-002')
      expect(output).toContain('미수행')
    }
  })
})
