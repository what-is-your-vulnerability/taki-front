import type { ReportModel } from '../report-model'

export function DiagnosisSummary({ report, overview = false }: { report: ReportModel; overview?: boolean }) {
  const n = (value: number | null) => value === null ? '—' : String(value)
  const complete = report.summary.inventoryComplete
  return <section class={['diagnosis-summary', overview && 'diagnosis-summary-overview']} aria-label="보안 판정 요약">
    <div class="diagnosis-primary"><span>판정 완료 기준 중 위반</span><div aria-label={`판정 완료 ${n(complete ? report.summary.judged : null)}개 중 위반 ${n(complete ? report.summary.violated : null)}개, 위반율 ${report.rateLabel}`}><strong class={complete && report.summary.violated ? 'plain-risk' : ''}>{n(complete ? report.summary.violated : null)} / {n(complete ? report.summary.judged : null)}</strong><small>{report.rateLabel}</small></div></div>
    <div class="diagnosis-grade"><span>보안 등급 · {report.gradeScope}</span><strong class={['D','E'].includes(report.assessment.grade || '') ? 'plain-risk' : ''}>{report.assessment.grade || '—'}<small>{report.gradeDescription}</small></strong></div>
    <p>전체 {n(report.summary.total)}개 기준 · 확인 필요 {n(report.summary.needsReview)}개 · 발견 {n(report.summary.findings)}건</p>
    <p class="diagnosis-note">{report.sample ? '표본 · ' : ''}위반율/등급은 확인 필요 제외</p>
  </section>
}
