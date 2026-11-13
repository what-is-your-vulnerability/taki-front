import { resultHref } from '../navigation'
import type { Page, Finding } from '../data'
import { defineComponent, nextTick, ref, watch } from 'vue'
import { currentReport, findingInReport } from '../report-context'
import { Icon, Button, Header } from '../ui'
import { VerificationLevels, ImpactContent, CodeFlow, ControlObservations } from './FindingEvidence'
import { SourceLocation } from './SourceLocation'
import { RunFacts } from '../components/WorkflowLayout'
import { CodeViewer } from './CodeViewer'

const tabs = ['근거','판정 이유','개선 방향','추가 확인'] as const
export const Detail = defineComponent({name:'Detail',props:['go','finding'],setup(props) {
  const tab = ref<typeof tabs[number]>('근거')
  watch(() => (props.finding as Finding).id, () => {tab.value='근거'})
  const changeTab = (value: typeof tabs[number]) => {tab.value=value}
  const jump = async (event: MouseEvent, id: string) => {
    event.preventDefault()
    if (id==='issue-code-title'||id==='issue-flow-title') tab.value='근거'
    await nextTick()
    const target=document.getElementById(id)
    target?.focus({preventScroll:true}); target?.scrollIntoView({block:'start'})
  }
  const tabKey = (event: KeyboardEvent, index: number) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0
    if (!step && !['Home','End'].includes(event.key)) return
    event.preventDefault()
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (index+step+tabs.length)%tabs.length
    changeTab(tabs[next]); document.getElementById(`issue-tab-${next}`)?.focus()
  }
  return () => {
    const {go,finding} = props as {go:(page:Page)=>void;finding:Finding}
    const report = currentReport(), item = findingInReport(report,finding.id)
    if (!item) return <><Header title={finding.id} onMenu={()=>{}}/><main id="main-content" tabindex={-1} class="content issue-detail v08-detail"><h2>이 항목의 분석 근거가 연결되지 않았습니다.</h2><Button onClick={()=>go('findings')}>목록으로</Button></main></>
    const question = item.type === '확인 필요'
    return <>
      <Header title={item.title} eyebrow={`${item.id} · ${item.type} · ${item.cwe}`} actions={<>{!question && <a class="btn btn-primary" href={resultHref(`/code-report/${item.id}`)}>코드 근거 보기</a>}<Button variant="secondary" ariaLabel="발견 목록으로" onClick={()=>go('findings')}>목록으로</Button></>}/>
      <main id="main-content" tabindex={-1} class="content issue-detail v08-detail">
        <div class="issue-heading"><div><h2>판정과 근거 위치</h2><p>{item.summary}</p><RunFacts rows={[['판정', item.type], ['위험도', question ? '보류' : item.level], ['코드 위치', <SourceLocation file={item.file}/>]]}/></div>
          <div class="issue-grade"><span>프로젝트 보안 등급</span><strong class={['D','E'].includes(report.assessment.grade || '') ? 'plain-risk' : ''}>{report.assessment.grade || '—'} <small>{report.assessment.grade ? report.gradeScope : '미측정'}</small></strong><p>{question ? '확인 필요 · 등급에서 제외' : item.determining ? '이 취약점이 등급 결정에 포함됩니다.' : '이 항목은 등급 결정 취약점이 아닙니다.'}</p></div>
        </div>
        <p class="report-meta issue-scope">{report.scope}</p>
        <nav class="issue-jump-links" aria-label="이슈 구역 바로가기">{[['issue-impact-title','업무 영향'],['issue-verification-title','검증 수준'],['issue-code-title','코드 근거'],['issue-flow-title','코드 흐름']].map(([id,label])=><a key={id} href={`#${id}`} onClick={event=>jump(event,id)}>{label}</a>)}</nav>
        <div class="issue-summary-grid"><section class="issue-impact" aria-labelledby="issue-impact-title"><h3 id="issue-impact-title" tabindex={-1}>예상 업무 영향</h3><div class="issue-section-body"><ImpactContent item={item}/></div></section><section class="issue-verification" aria-labelledby="issue-verification-title"><h3 id="issue-verification-title" tabindex={-1}>검증 수준</h3><div class="issue-section-body"><VerificationLevels report={report}/><RunFacts rows={[['설계 원문', report.scopeEntries.find(entry=>entry.label==='설계문서')?.value], ['AI 추론', '실제 AI 분석 미수행'], ['사람 보완', '이 표본에 적용된 Rule 보완 없음']]}/></div></section></div>
        <div class="tabs issue-tabs" role="tablist" aria-label="이슈 상세 내용">{tabs.map((value,index)=><button role="tab" id={`issue-tab-${index}`} aria-selected={tab.value===value} aria-controls="issue-panel" tabindex={tab.value===value ? 0 : -1} class={tab.value===value?'active':''} key={value} onClick={()=>changeTab(value)} onKeydown={event=>tabKey(event,index)}>{value}</button>)}</div>
        <div id="issue-panel" role="tabpanel" aria-labelledby={`issue-tab-${tabs.indexOf(tab.value)}`} tabindex={0}>
          {tab.value==='근거' && <>
            <div class="issue-evidence-grid"><section aria-labelledby="issue-code-title"><div class="issue-section-heading"><h3 id="issue-code-title" tabindex={-1}>코드 근거</h3><a href={item.sourceUrl} target="_blank" rel="noreferrer">원본 코드 <Icon name="link" size={14}/></a></div><div class="issue-section-body"><CodeViewer code={item.code} label="코드 근거" file={item.file} version={report.version}/><p class="report-meta">설명용 축약 코드 · 원본 행 번호는 원본에서 확인</p></div></section>
              <section aria-labelledby="issue-flow-title"><h3 id="issue-flow-title" tabindex={-1}>코드 흐름</h3><div class="issue-section-body"><CodeFlow item={item}/></div></section></div>
            <div class="issue-evidence-grid issue-secondary"><section aria-labelledby="issue-controls-title"><h3 id="issue-controls-title">통제와 판단 이유</h3><div class="issue-section-body"><p>{item.reason}</p><ControlObservations item={item}/></div></section><section aria-labelledby="issue-basis-title"><h3 id="issue-basis-title">판정 기준과 자료</h3><div class="issue-section-body"><p class="report-meta">{item.criteria.map(criterion=>`${criterion.id} · ${criterion.title}`).join(' / ') || '판정 기준 근거 미연결'}</p><dl class="report-controls"><div><dt>설계문서</dt><dd>{report.scopeEntries.find(entry=>entry.label==='설계문서')?.value}</dd></div></dl><div class="issue-policy-links">{item.policies.length ? item.policies.map(policy=><a key={policy.id} href={`#/criteria/${policy.id}`}>{policy.id} · {policy.title} <Icon name="arrow" size={14}/></a>) : <p>연결된 사용자 규정 없음</p>}</div><p class="report-meta">규정은 선택 예제이며 실제 추출·자동 적용은 미수행입니다.</p><a class="issue-reference" href={item.cweUrl} target="_blank" rel="noreferrer">{item.cwe} 기준 <Icon name="link" size={14}/></a></div></section></div>
          </>}
          {tab.value==='판정 이유' && <section class="issue-prose" aria-labelledby="issue-reason-title"><h3 id="issue-reason-title">판정 이유</h3><div class="issue-section-body"><h4>{item.reasonTitle}</h4><p>{item.reason}</p><dl class="report-controls">{item.reasons.map(reason=><div key={reason.title}><dt>{reason.title}</dt><dd>{reason.detail}</dd></div>)}</dl></div></section>}
          {tab.value==='개선 방향' && <section class="issue-prose" aria-labelledby="issue-remediation-title"><h3 id="issue-remediation-title">개선 방향</h3><div class="issue-section-body"><h4>{item.improvementTitle}</h4><p>{item.improvement}</p>{item.improvementCode && <><p class="report-meta">개선 예시 · 설명용 축약 · 원본 수정 미수행</p><CodeViewer code={item.improvementCode} label="개선 예시"/></>}<p class="report-meta">개선 방향을 제안하며 자동 수정이나 재진단은 수행하지 않습니다.</p></div></section>}
          {tab.value==='추가 확인' && <section class="issue-prose" aria-labelledby="issue-checks-title"><h3 id="issue-checks-title">추가 확인</h3><div class="issue-section-body"><h4>{question?'판정 전에 필요한 자료':'수정 후 확인할 항목'}</h4><p class="report-meta">아래는 수행 전 확인 항목이며 실제 검증 완료 상태가 아닙니다.</p><ul class="report-checks">{item.checks.map(check=><li key={check.title}><strong>{check.title}</strong><p>{check.detail}</p></li>)}</ul></div></section>}
        </div>
      </main>
    </>
  }
}})
