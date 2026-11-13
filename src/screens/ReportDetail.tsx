import { resultHref } from '../navigation'
import type { ReportFinding, ReportModel } from '../report-model'
import { Icon } from '../ui'
import { VerificationLevels, ImpactContent, CodeFlow, ControlObservations } from './FindingEvidence'
import { shortSourceLocation } from '../source-location'
import { CodeViewer } from './CodeViewer'

export function ReportDetail({item, report}: {item: ReportFinding; report: ReportModel}) {
  return <article class="report-detail" aria-labelledby={`detail-${item.id}`}>
    <details class="report-disclosure">
    <summary id={`detail-${item.id}`}>
      <div class="report-disclosure-label"><p class="report-meta">{item.id} · {item.cwe} {item.determining && '· 등급 결정 취약점'}</p><h4>{item.title}</h4><p class="report-meta">{shortSourceLocation(item.file)}</p></div>
      <span class={item.type === '취약 사례' ? 'plain-risk' : 'report-meta'}>{item.type === '취약 사례' ? item.level : '확인 필요'}</span>
      <span class="report-disclosure-toggle" aria-hidden="true"><span class="when-closed">상세 보기</span><span class="when-open">접기</span><Icon name="chevron" size={18}/></span>
    </summary>
    <div class="report-detail-body">
    <p class="report-meta">{item.criteria.map(criterion => `${criterion.id} · ${criterion.title}`).join(' / ') || '판정 기준 근거 미연결'}</p>
    <VerificationLevels report={report}/>
    <div class="report-impact"><h5>예상 업무 영향</h5><ImpactContent item={item}/></div>
    <div class="report-detail-columns"><div>
      <h5>코드 근거</h5><CodeViewer code={item.code} label="코드 근거" file={item.file} version={report.version}/><p class="report-meta">설명용 축약 코드 · 원본 행 번호는 원본에서 확인</p>
      <div class="report-source-links"><a href={item.sourceUrl} target="_blank" rel="noreferrer">원본 코드 <Icon name="link" size={14}/></a>{item.type === '취약 사례' && <a href={resultHref(`/code-report/${encodeURIComponent(item.id)}`)}>코드 근거 리포트 <Icon name="arrow" size={14}/></a>}<a href={resultHref(`/findings/${item.id}`)}>이슈 상세 <Icon name="arrow" size={14}/></a><a href={item.cweUrl} target="_blank" rel="noreferrer">CWE 기준 <Icon name="link" size={14}/></a></div>
    </div><div><h5>코드 흐름</h5><CodeFlow item={item}/></div></div>
    <div class="report-detail-columns"><div><h5>통제와 판단 이유</h5><p>{item.reason}</p><ControlObservations item={item}/></div><div><h5>{item.type === '확인 필요' ? '추가 확인' : '수정 방향'}</h5><p>{item.improvement}</p><h5>확인할 항목 <small>수행 전</small></h5><ul class="report-checks">{item.checks.map(check => <li key={check.title}><strong>{check.title}</strong><p>{check.detail}</p></li>)}</ul></div></div>
    {item.policies.map(policy => <div class="report-policy" key={policy.id}><h5>연결된 규정 · {policy.id}</h5><p class="report-meta">{report.policyExample.title} · {report.policyExample.version} · 실제 사내 규정 아님</p><blockquote>{policy.original}</blockquote><dl class="report-controls"><div><dt>조건</dt><dd>{policy.condition}</dd></div><div><dt>예외</dt><dd>{policy.exception}</dd></div><div><dt>적용 범위</dt><dd>{policy.scope}</dd></div></dl><p class="report-meta">{policy.limitation}</p></div>)}
    </div>
    </details>
  </article>
}
