import type { Finding } from './data'
import { formatViolationRate, summarizeJudgments, type JudgmentSnapshot } from './judgments'
import { assessSecurityGrade, gradeDescriptions } from './security-grade'
import { getCriterion, policyExample, validCriterionIds } from './policies'

export interface ReportContext {
  projectName?: string
  rootPath?: string
  documentName?: string
  criterionIds?: string[]
  exampleRun?: { id: string; createdAt: string; partial: boolean }
  judgmentSnapshot?: JudgmentSnapshot | null
}

export const reportLimitations = [
  '공개 코드의 수동 검토 표본이며 전체 저장소 분석이나 운영 환경의 보안 등급을 나타내지 않습니다.',
  'AI 진단·문서 내용 분석·규칙 실행·공격 재현·기존 도구 비교를 실제 수행한 결과가 아닙니다.',
  '코드와 흐름은 설명용으로 축약했습니다. 파일·행은 고정 버전의 원본 링크에서 확인하세요.',
  '문서·규정 선택은 분석·자동 적용 완료를 뜻하지 않습니다. 자료 없는 업무 정책은 확인 필요로 남깁니다.',
]

export function buildReportModel(items: readonly Finding[], version: string, withDocument: boolean, context: ReportContext = {}, issuedAt = new Date()) {
  // Copy once: an asynchronous export must not mix changing selections or evidence.
  const snapshot = context.judgmentSnapshot ? structuredClone(context.judgmentSnapshot) : null
  const summary = summarizeJudgments(snapshot)
  const selectedCriteria = validCriterionIds(context.criterionIds).map(id => structuredClone(getCriterion(id)!))
  const referencedIds = snapshot ? new Set(snapshot.items.flatMap(item => [...item.findingIds])) : null
  const evidence = [...new Map(items.filter(item => !referencedIds || referencedIds.has(item.id)).map(item => [item.id, item])).values()]
  const assessment = assessSecurityGrade(snapshot, evidence)
  const details = evidence.map(item => ({
    ...structuredClone(item),
    determining: assessment.determiningFindingIds.includes(item.id),
    criteria: summary.items.filter(criterion => criterion.findingIds.includes(item.id)),
    policies: selectedCriteria.filter(criterion => criterion.findingId === item.id),
  }))
  const sample = snapshot?.source === 'manual-sample'
  const files = [...new Set(evidence.map(item => item.file.replace(/:\d+(?:-\d+)?$/, '')))]
  const document = withDocument ? `${context.documentName || '맥락 문서 선택됨'} · ${context.exampleRun?.partial ? '일부 추출 실패 시연' : '내용 분석 미수행'}` : '미제공 — 코드 단독 경로'
  const verification = [
    { label: '근거 출처', value: sample ? '공개 코드 수동 검토 예제' : '출처 확인 대기' },
    { label: '코드 검토', value: sample ? '수동 표본 · 전체 경로 미검증' : '검토 결과 미연결' },
    { label: '규칙 실행', value: '미수행' },
    { label: '실행 재현', value: '미수행' },
  ]
  return {
    project: context.projectName || 'OWASP Juice Shop', version: version || '버전 미확인',
    issuedAt: issuedAt.toISOString(),
    issuedLabel: new Intl.DateTimeFormat('ko-KR', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false }).format(issuedAt),
    sample, scope: snapshot?.scopeLabel || '전체 판정 결과 연결 대기',
    gradeScope: sample ? '표본 기준' : '분석 기준',
    assessment, gradeDescription: assessment.grade ? gradeDescriptions[assessment.grade] : '미측정',
    summary, rateLabel: formatViolationRate(summary.violationRate),
    confirmed: details.filter(item => item.type === '취약 사례'),
    questions: details.filter(item => item.type === '확인 필요'),
    causes: details.filter(item => item.determining),
    files, selectedCriteria, policyExample: { ...policyExample }, verification,
    scopeEntries: [
      { label: '코드베이스 경로', value: `${context.rootPath || '연결 대기'}${context.rootPath ? sample ? ' · 예제 경로, 실제 경로 접근 미수행' : ' · 실제 경로 접근 미수행' : ''}` },
      { label: '대상 버전', value: version || '버전 미확인' },
      { label: '브랜치 / 커밋 SHA', value: '미연결' },
      { label: '참고한 근거 파일', value: files.length ? `${files.length}개 · ${files.join(', ')}` : '근거 미연결' },
      { label: '그 외 코드 범위', value: '전체 저장소 분석 미수행 · 전체 파일 수와 분석률 미집계' },
      { label: '제외 경로', value: '제외 설정 미제공 · 미분석 영역과 별개' },
      { label: '설계문서', value: document },
      { label: '규정 기준', value: selectedCriteria.length ? `${selectedCriteria.map(item => item.id).join(', ')} · 선택 예제, 실제 자동 적용 미수행` : '미선택' },
      { label: '분석 실행 / 시각 / 엔진', value: context.exampleRun ? `${context.exampleRun.id} · ${context.exampleRun.createdAt} · 수동 시연` : '실제 실행 정보 미연결 · 분석 미수행' },
      { label: 'Rule / 실행 비용', value: '예제 Rule v1 · 실행 비용 미측정' },
    ],
    limitations: [...reportLimitations],
  }
}

export type ReportModel = ReturnType<typeof buildReportModel>
export type ReportFinding = ReportModel['confirmed'][number]
