import { describe, expect, it } from 'vitest'
import { readFile, mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import pdfMake from 'pdfmake/build/pdfmake'
import { findings } from './data'
import { publicJudgmentSample } from './judgments'
import { buildPdfReport } from './report-pdf'

const sample = () => buildPdfReport(findings, 'v19.0.0', false, { projectName: 'OWASP Juice Shop', rootPath: '/examples/juice-shop', judgmentSnapshot: publicJudgmentSample }, new Date('2026-11-04T03:00:00Z'))
describe('공유용 PDF 리포트', () => {
  it('요약에 같은 표본 등급과 결정 취약점의 위치·원본을 유지한다', () => {
    const doc = sample()
    const summary = JSON.stringify(doc.content).split('취약점 상세')[0]
    for (const value of ['표본 기준', '전체 코드 결과 아님', 'TRC-001', 'TRC-002', 'routes/login.ts:31', 'routes/basket.ts:17']) expect(summary).toContain(value)
    expect(summary).toContain('"text":"D"')
    expect(summary).not.toContain('TRC-003')
    expect(JSON.stringify(doc.content)).toContain('등급에서 제외')
    expect(doc.pageSize).toBe('A4')
  })
  it('등급 근거가 없으면 예제 등급을 넣지 않고 미측정을 표시한다', () => {
    const doc = buildPdfReport(findings, 'v19.0.0', false)
    const summary = JSON.stringify(doc.content).split('취약점 상세')[0]
    expect(summary).toContain('미측정')
    expect(summary).not.toContain('"text":"D"')
    expect(summary).not.toContain('TRC-001')
  })
  it('실제 브라우저 PDF 엔진과 한글 글꼴로 다운로드 가능한 PDF를 생성한다', async () => {
    const [regular, bold] = await Promise.all(['Regular', 'Bold'].map(weight => readFile(resolve(`public/fonts/noto-sans-kr/NotoSansKR-${weight}.otf`))))
    pdfMake.addVirtualFileSystem({ 'regular.otf': regular.toString('base64'), 'bold.otf': bold.toString('base64') })
    pdfMake.addFonts({ NotoKR: { normal: 'regular.otf', bold: 'bold.otf', italics: 'regular.otf', bolditalics: 'bold.otf' } })
    const buffer = await pdfMake.createPdf(sample()).getBuffer()
    expect(buffer.subarray(0, 5).toString()).toBe('%PDF-')
    expect(buffer.length).toBeGreaterThan(10_000)
    if (process.env.TRACE_PDF_QA_OUTPUT) {
      await mkdir(dirname(process.env.TRACE_PDF_QA_OUTPUT), { recursive: true })
      await writeFile(process.env.TRACE_PDF_QA_OUTPUT, buffer)
      const longItems = Array.from({length:6}, (_,i) => ({...findings[0],id:`QA-${i+1}`,file:`src/${'long_directory_'.repeat(16)}file.ts:123`,code:`const longValue = '${'long_value_'.repeat(60)}'`}))
      const stress = buildPdfReport(longItems, 'qa-only', false, {judgmentSnapshot:{...publicJudgmentSample,items:longItems.map(item=>({id:`criterion-${item.id}`,title:'긴 근거의 출력 검사',outcome:'violated',findingIds:[item.id]}))}})
      await mkdir('tmp/pdfs/report-revision', {recursive:true})
      await writeFile('tmp/pdfs/report-revision/stress.pdf', await pdfMake.createPdf(stress).getBuffer())
      const policies = buildPdfReport(findings,'v19.0.0',true,{documentName:'설계.md',criterionIds:['CR-001','CR-002'],judgmentSnapshot:publicJudgmentSample})
      await writeFile('tmp/pdfs/report-revision/policies.pdf', await pdfMake.createPdf(policies).getBuffer())
    }
  }, 20_000)
})
