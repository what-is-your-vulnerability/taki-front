import type { ReportFinding, ReportModel } from '../report-model'

export function VerificationLevels({report}: {report: ReportModel}) {
  return <dl class="report-verification" aria-label="검증 수준">{report.verification.map(state => <div key={state.label}><dt>{state.label}</dt><dd>{state.value}</dd></div>)}</dl>
}

export function ImpactContent({item}: {item: ReportFinding}) {
  return <><p>{item.impact || '영향 미확인'}</p><small>공격 조건·실제 피해는 별도 검증이 필요합니다.</small></>
}

export function CodeFlow({item}: {item: ReportFinding}) {
  return <div class="evidence-flow"><p class="report-meta">입력 {item.input || '미확인'} → 실행/조회 {item.sink || '미확인'}</p><ol class="report-flow">{item.flow.map((step,i) => <li key={i}><span class="flow-step-number">{i+1}</span><div class="flow-step-body"><strong>{step.title}</strong><p>{step.detail}</p></div></li>)}</ol><p class="report-meta">수동 설명 예제 · 중간 호출 경로 전체 추적 미수행</p></div>
}

export function ControlObservations({item}: {item: ReportFinding}) {
  return <dl class="report-controls" aria-label="통제 관찰">{item.controls.map(control => <div key={control.title}><dt>{control.title}</dt><dd>{control.detail}</dd></div>)}</dl>
}
