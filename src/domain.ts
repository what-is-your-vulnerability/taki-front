import { serviceName } from './brand'
import type { Finding } from './data'
import type { FindingStatus } from './types'
import { buildReportModel, type ReportContext, type ReportModel, type ReportFinding } from './report-model'
export type { ReportContext } from './report-model'
export function filterFindings(items: Finding[], query: string, status: FindingStatus | 'all') {
  const text = query.trim().toLocaleLowerCase()
  return items.filter(f => (status === 'all' || (f.type === '확인 필요' ? 'review' : 'vulnerability') === status) && (!text || `${f.id} ${f.title} ${f.file} ${f.cwe} `.toLocaleLowerCase().includes(text)))
}
export function summarize(items: Finding[]) { return { vulnerabilities:items.filter(f=>f.type==='취약 사례').length, review:items.filter(f=>f.type==='확인 필요').length } }
export function reportMarkdown(report: ReportModel): string {
  const n = (value: number | null) => value === null ? '—' : String(value)
  const detail = (item: ReportFinding) => [
    `### ${item.id} · ${item.title}`, '',
    `분류: ${item.type} / 위험도 ${item.level} / ${item.cwe}${item.determining ? ' / 등급 결정 취약점' : ''}`,
    `근거 위치: ${item.file} · ${report.version} 참고 위치`,
    `판정 기준: ${item.criteria.map(criterion => `${criterion.id} ${criterion.title}`).join('; ') || '근거 미연결'}`, '',
    '#### 검증 수준', ...report.verification.map(state => `- ${state.label}: ${state.value}`), '',
    '#### 예상 업무 영향', item.impact || '영향 미확인', '공격 조건과 실제 피해는 별도 검증이 필요합니다.', '',
    '#### 코드 근거', '설명용 축약 코드 · 원본 행 번호는 아래 링크에서 확인', '```', item.code, '```',
    `[원본 코드](${item.sourceUrl}) · [CWE 기준](${item.cweUrl})`, '',
    '#### 코드 흐름', `입력: ${item.input || '미확인'} → 실행/조회: ${item.sink || '미확인'}`,
    ...item.flow.map((step, index) => `${index + 1}. ${step.title}: ${step.detail}`),
    '수동 설명 예제 · 중간 호출 경로 전체 추적 미수행', '',
    '#### 통제와 판단 이유', item.reason,
    ...item.controls.map(control => `- ${control.title}: ${control.detail}`), '',
    ...item.policies.flatMap(policy => [
      `#### 연결된 규정 ${policy.id}`, `${report.policyExample.title} · ${report.policyExample.version} · 실제 사내 규정 아님`,
      `원문: ${policy.original}`, `조건: ${policy.condition}`, `예외: ${policy.exception}`, `범위: ${policy.scope}`, policy.limitation, '',
    ]),
    `#### ${item.type === '확인 필요' ? '추가 확인' : '수정 방향'}`, item.improvement, '',
    '#### 확인할 항목 · 수행 전', ...item.checks.map(check => `- ${check.title}: ${check.detail}`), '',
  ].join('\n')
  return [
    `# ${serviceName} · 웹 소스코드 보안 진단 리포트`, '',
    `대상: ${report.project} · ${report.version}`, `문서 생성: ${report.issuedLabel} (KST) · 분석 실행일과 별도`,
    report.scope, 'AI 진단·규칙 실행·성능 평가를 실제 수행한 결과가 아닙니다.', '',
    '## 요약', `위반 ${n(report.summary.violated)} / 판정 완료 ${n(report.summary.judged)} · ${report.rateLabel}`,
    `확인 필요 ${n(report.summary.needsReview)} / 발견 ${n(report.summary.findings)}건`,
    '위반율 = 위반 / (위반 + 충족). 확인 필요·미판정은 분모에서 제외합니다.', '',
    '## 보안 등급', `보안 등급: ${report.assessment.grade ? `**${report.assessment.grade} · ${report.gradeScope}**` : '미측정'}`,
    `산정 범위: ${report.scope}`, '',
    `등급 결정 취약점 ${report.causes.length}건`,
    ...report.causes.map(item => `- **${item.id} · ${item.title}** — ${item.level} · ${item.cwe}\n  - 근거 위치: ${item.file}\n  - 예상 영향: ${item.impact}\n  - [원본 코드](${item.sourceUrl})`),
    '확인 필요 항목은 등급에서 제외합니다.', '',
    '## 선택 자료', ...report.scopeEntries.map(entry => `- ${entry.label}: ${entry.value}`),
    '기준은 화면 검토용 예제이며 실제 AI 추출·규칙 적용 결과가 아닙니다.', '',
    '## 우선 조치', ...report.causes.map(item => `- ${item.id} · ${item.improvementTitle}: ${item.improvement}`), '',
    '## 취약점 상세', ...report.confirmed.map(detail), '',
    '## 추가 확인 · 등급과 발견 건수에서 제외', ...report.questions.map(detail), '',
    '## 분석 한계', ...report.limitations.map(text => `- ${text}`), '',
  ].join('\n')
}

export function createReport(items: Finding[], version: string, withDocument: boolean, context: ReportContext = {}) {
  return reportMarkdown(buildReportModel(items, version, withDocument, context))
}
