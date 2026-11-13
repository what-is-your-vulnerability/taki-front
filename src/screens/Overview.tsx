import { defineComponent, nextTick, ref } from 'vue'
import { RunLink as RouterLink } from '../components/RunLink'
import { JudgmentSummary } from '../components/JudgmentSummary'
import { DiagnosisSummary } from '../components/DiagnosisSummary'
import { RunFacts, SectionBand } from '../components/WorkflowLayout'
import { judgmentLabels, type JudgmentOutcome } from '../judgments'
import { currentReport } from '../report-context'
import { gradeDescriptions, securityGrades } from '../security-grade'
import { selectedRun } from '../workflow'
import { DisclosureCue, Header, Button, Icon } from '../ui'

const levels = ['차단 수준', '높음', '중간', '낮음', '정보']
const outcomes: JudgmentOutcome[] = ['violated', 'satisfied', 'needs-review', 'unassessed']

export const Overview = defineComponent({ name: 'Overview', props: ['go'], setup(props) {
  const scope = ref('sample'), filter = ref('all'), mapHeading = ref<HTMLElement | null>(null)
  const issuedAt = new Date()
  const selectFilter = async (value: string) => {
    filter.value = value
    if (value === 'grade' || (value !== 'all' && matchMedia('(max-width: 760px)').matches)) {
      await nextTick()
      mapHeading.value?.focus({ preventScroll: true })
      mapHeading.value?.scrollIntoView({ block: 'start' })
    }
  }

  return () => {
    const report = currentReport(issuedAt)
    const { summary, assessment } = report
    const run = selectedRun()
    const evidence = new Map([...report.confirmed, ...report.questions].map(item => [item.id, item]))
    const countedIds = new Set(summary.items.filter(item => item.outcome === 'violated').flatMap(item => [...item.findingIds]))
    const gradeIds = new Set(assessment.determiningFindingIds)
    const accepts = (id: string) => filter.value === 'grade' ? gradeIds.has(id) : countedIds.has(id) && `level:${evidence.get(id)?.level}` === filter.value
    const byEvidence = filter.value === 'grade' || filter.value.startsWith('level:')
    const visible = summary.items.filter(item => byEvidence ? item.findingIds.some(accepts) : filter.value === 'all' || item.outcome === filter.value)
    const filterLabel = filter.value === 'grade' ? '등급 근거' : filter.value.startsWith('level:') ? filter.value.slice(6) : judgmentLabels[filter.value as JudgmentOutcome] || '전체'
    const distribution = levels.map(level => ({ level, count: report.confirmed.filter(item => countedIds.has(item.id) && item.level === level).length }))
    const maxCount = Math.max(1, ...distribution.map(item => item.count))
    return <><Header title={report.project} eyebrow={`${report.version} · 공개 코드 수동 검토 표본`} actions={<><Button variant="secondary" onClick={() => props.go('new')}>새 진단</Button><RouterLink class="btn btn-primary" to="/report">리포트 보기</RouterLink></>}/>
      <main id="main-content" tabindex={-1} class="content d2-overview v08-flow">
        <div class="view-switch" aria-label="분석 범위"><button aria-pressed={scope.value === 'sample'} onClick={() => scope.value = 'sample'}>검토 표본</button><button aria-pressed={scope.value === 'new'} onClick={() => scope.value = 'new'}>신규 코드</button><span>고정 버전 {report.version}</span></div>
        {scope.value === 'new' ? <section class="plain-empty"><Icon name="code"/><h2>신규 코드 기준 연결이 필요합니다</h2><p>기준 버전과 분석 결과가 연결되면 신규 항목을 구분합니다.</p><a class="text-link" href="#/settings?tab=new-code">신규 코드 설정 <Icon name="arrow" size={15}/></a></section>
          : !summary.available ? <JudgmentSummary snapshot={null} gradeAssessment={assessment}/>
          : <>
            <p class="d2-muted d2-scope-label">{report.scope}</p>
            <div class="v08-grid v08-overview-grid">
              <div class="v08-stack">
                <DiagnosisSummary report={report} overview/>
                <section class="d2-map" aria-labelledby="d2-map-title">
                  <div class="v08-band"><h2 id="d2-map-title" ref={mapHeading} tabindex={-1}>판정 근거 맵</h2><RouterLink class="v08-link" to="/findings">전체 판정 보기</RouterLink></div>
                  <div class="v08-map-filters" aria-label="판정 상태 필터">
                    <button type="button" aria-pressed={filter.value === 'all'} onClick={() => selectFilter('all')}>전체</button>
                    {outcomes.filter(id => id !== 'unassessed' || summary.unassessed).map(id => <button key={id} type="button" aria-pressed={filter.value === id} onClick={() => selectFilter(id)}>{judgmentLabels[id]} {summary.items.filter(item => item.outcome === id).length}</button>)}
                    {byEvidence && <span role="status">{filterLabel} {visible.length}개</span>}
                  </div>
                  <div id="d2-map-rows" class="v08-rows">{visible.map(criterion => {
                    const ids = criterion.findingIds.filter(id => !byEvidence || accepts(id))
                    return (ids.length ? ids : ['']).map(id => {
                      const item = evidence.get(id)
                      const content = <><span><strong>{criterion.title}</strong><small>{[criterion.id, item?.file].filter(Boolean).join(' · ')}</small></span><span class={['d2-badge', criterion.outcome]}>{judgmentLabels[criterion.outcome]}</span></>
                      return item ? <RouterLink class="v08-row" key={`${criterion.id}:${id}`} to={`/findings/${encodeURIComponent(id)}`}>{content}<Icon name="chevron" size={16}/></RouterLink> : <div class="v08-row" key={criterion.id}>{content}</div>
                    })
                  })}{!visible.length && <p class="v08-notice" role="status">선택한 조건에 해당하는 항목이 없습니다.</p>}</div>
                </section>
              </div>
              <aside class="v08-stack">
                <section class="v08-well">
                  <div class="d2-panel-heading"><h2 id="v08-security-grade" tabindex={-1}>보안 등급 {assessment.grade ?? '—'}</h2><span class="d2-muted">{assessment.grade ? report.gradeScope : '미측정'}</span></div>
                  <ol class="d2-ladder v08-ladder" aria-label="보안 등급 A부터 E">{securityGrades.map(grade => <li key={grade} title={gradeDescriptions[grade]} aria-current={grade === assessment.grade ? 'true' : undefined}>{grade}</li>)}</ol>
                  <div class="v08-actions"><span class="d2-muted">최고 심각도 · {report.gradeDescription}</span>{report.causes.length > 0 && <button class="v08-link" type="button" aria-controls="d2-map-rows" aria-pressed={filter.value === 'grade'} onClick={() => selectFilter('grade')}>등급 근거 보기</button>}</div>
                  {report.causes.map(item => <RouterLink class="v08-row" to={`/findings/${item.id}`} key={item.id}><span><strong>{item.title}</strong><small>{item.id} · {item.file}</small></span><Icon name="chevron" size={16}/></RouterLink>)}
                </section>
                <details class="v08-disclosure overview-scope"><summary class="disclosure-summary"><span>실행 범위 · 근거 파일 {report.files.length}개</span><DisclosureCue/></summary><div class="v08-well"><RunFacts rows={[
                  ['실행 ID', run?.id || '기존 공개 표본'], ['코드 버전', report.version],
                  ['근거 파일', report.files.join(' · ') || '근거 미연결'],
                  ['설계 문서', report.scopeEntries.find(item => item.label === '설계문서')?.value || '미제공'],
                  ['규정 기준', report.selectedCriteria.length ? `예제 ${report.selectedCriteria.length}개` : '미선택'],
                  ['검증 수준', report.verification[1].value],
                ]}/></div></details>
                {run?.design === 'partial' && <div class="v08-notice is-warning"><strong>부분 완료</strong><p>설계 문서 일부 추출 실패 시연 · 코드 표본 결과 이용 가능</p></div>}
                <details class="v08-disclosure"><summary class="disclosure-summary"><span>심각도별 발견</span><DisclosureCue/></summary><ul class="d2-distribution" aria-label="심각도 필터">{distribution.map(item => <li key={item.level}><button type="button" aria-controls="d2-map-rows" aria-pressed={filter.value === `level:${item.level}`} onClick={() => selectFilter(`level:${item.level}`)}><span>{item.level}</span><span class="d2-bar" aria-hidden="true"><i style={{width:`${item.count / maxCount * 100}%`}}/></span><strong>{item.count}</strong></button></li>)}</ul></details>
              </aside>
            </div>
            <nav class="d2-related v08-footer" aria-label="관련 화면"><RouterLink to="/runs">분석 기록</RouterLink><RouterLink to="/quality-gate">Quality Gate · 판정 대기</RouterLink><RouterLink to="/measures">측정값</RouterLink><RouterLink to="/report">전체 리포트 <Icon name="arrow" size={14}/></RouterLink></nav>
          </>}
      </main></>
  }
} })
