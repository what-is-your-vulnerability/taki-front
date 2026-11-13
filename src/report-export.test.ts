import { expect, it } from 'vitest'
import { findings } from './data'
import { publicJudgmentSample } from './judgments'
import { buildReportModel } from './report-model'
import { reportHtml, reportText } from './report-export'

it('HTML·TXT는 접힘 상태와 무관하게 등급·표본·전체 상세와 질문을 유지한다', () => {
  const report = buildReportModel(findings, 'v19.0.0', false, { judgmentSnapshot: publicJudgmentSample })
  for (const output of [reportHtml(report), reportText(report)]) {
    for (const value of ['표본 기준', 'TRC-001', 'TRC-002', 'TRC-003', 'routes/login.ts:31', 'routes/basket.ts:17', '코드 흐름', '검증 수준']) expect(output).toContain(value)
  }
})

it('HTML 내 프로젝트·취약점 제목·코드의 태그를 실행 가능한 내용으로 넣지 않는다', () => {
  const items = [{ ...findings[0], title: '<script>alert(1)</script>', code: '</code></pre><img src=x onerror=alert(1)>' }]
  const report = buildReportModel(items, 'v19.0.0', false, { projectName: '<img src=x onerror=alert(1)>' })
  const output = reportHtml(report)
  expect(output).not.toContain('<script>')
  expect(output).not.toContain('<img')
  expect(output).toContain('&lt;script&gt;')
  expect(output).toContain('&lt;img')
})
