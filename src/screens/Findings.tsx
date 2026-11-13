import { computed, defineComponent, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RunLink as RouterLink } from '../components/RunLink'
import { findings } from '../data'
import { filterFindings } from '../domain'
import { currentReport } from '../report-context'
import { reviews, reviewLabels } from '../triage'
import { RunFacts, SectionBand } from '../components/WorkflowLayout'
import { DisclosureCue, Badge, Button, Header, Icon } from '../ui'
import { SourceLocation } from './SourceLocation'
import { defaultFindingFilters, filterScope, filtersExpanded, readFindingFilters, rememberFilterExpanded, writeFindingFilters, type FindingFilters } from '../finding-filters'

const options = [
  ['vulnerability', '취약점 발견'], ['missing', '규정 미구현'], ['satisfied', '점검 기준 충족'],
  ['review', '확인 필요'], ['not-applicable', '해당 없음'],
] as const

export const Findings = defineComponent({ name: 'Findings', props: ['selectFinding'], setup(props) {
  const route = useRoute(), router = useRouter()
  const cwes = [...new Set(findings.map(item => item.cwe))]
  const filters = computed(() => readFindingFilters(route.query, cwes, currentReport().files))
  const expanded = ref(filtersExpanded(route.query))
  watch(() => filterScope(route.query), () => { expanded.value = filtersExpanded(route.query) })
  const update = (patch: Partial<FindingFilters>) => router.replace({ query: writeFindingFilters(route.query, { ...filters.value, ...patch }) })
  const reset = () => update(defaultFindingFilters)
  return () => {
    const report = currentReport()
    const { query, kind, cwe, file, sort } = filters.value
    const base = filterFindings(findings, query, 'all').filter(item =>
      (cwe === 'all' || item.cwe === cwe) && (file === 'all' || item.file.startsWith(file)),
    )
    const count = (status: string) => status === 'vulnerability' ? base.filter(item => item.type === '취약 사례').length
      : status === 'review' ? base.filter(item => item.type === '확인 필요').length
      : status === 'satisfied' && !query && cwe === 'all' && file === 'all' ? report.summary.satisfied ?? 0 : 0
    const visible = base.filter(item => kind === 'all' || kind === (item.type === '취약 사례' ? 'vulnerability' : 'review'))
      .sort((a,b) => sort === 'id' ? a.id.localeCompare(b.id) : Number(a.type === '확인 필요') - Number(b.type === '확인 필요') || a.id.localeCompare(b.id))
    const active = [kind !== 'all' && options.find(([id]) => id === kind)?.[1], query && `검색: ${query}`, cwe !== 'all' && cwe, file !== 'all' && `파일: ${file}`, sort !== 'priority' && 'ID순'].filter(Boolean)
    return <>
      <Header title="판정 목록" eyebrow={`검토 표본 ${report.summary.total ?? '—'}개 · 현재 조건에 맞는 항목 ${visible.length}개`} actions={<RouterLink class="v08-link" to="/report">리포트</RouterLink>}/>
      <main id="main-content" tabindex={-1} class="content v08-flow findings-page">
        <div class="v08-grid">
          <section class="v08-stack">
            <SectionBand title="판정 항목"/>
            <div class="v08-actions v08-filter"><select aria-label="판정 필터" value={kind} onChange={event => update({ kind: (event.target as HTMLSelectElement).value })}><option value="all">모든 판정</option>{options.map(([id,label]) => <option key={id} value={id}>{label}</option>)}</select><span class="v08-note" role="status">{visible.length}개</span></div>
            {active.length > 0 && <div class="v08-active-filters" aria-label="적용 중인 필터">{active.map(label => <span key={String(label)}>{label}</span>)}{visible.length > 0 && <Button variant="secondary" onClick={reset}>필터 초기화</Button>}</div>}
            <details class="v08-disclosure" open={expanded.value} onToggle={event => { expanded.value = (event.target as HTMLDetailsElement).open; rememberFilterExpanded(route.query, expanded.value) }}><summary class="disclosure-summary"><span>검색 및 추가 필터{active.length > 0 && ' · 적용 중'}</span><DisclosureCue/></summary>
              <div class="issue-toolbar"><label class="search"><Icon name="search"/><input aria-label="발견 검색" placeholder="ID·제목·파일·CWE 검색" maxlength={255} value={query} onInput={event => update({ query: (event.target as HTMLInputElement).value })}/></label><select aria-label="CWE 필터" value={cwe} onChange={event => update({ cwe: (event.target as HTMLSelectElement).value })}><option value="all">모든 CWE</option>{cwes.map(value => <option key={value}>{value}</option>)}</select><select aria-label="파일 필터" value={file} onChange={event => update({ file: (event.target as HTMLSelectElement).value })}><option value="all">모든 파일</option>{report.files.map(value => <option key={value}>{value}</option>)}</select><select aria-label="판정 정렬" value={sort} onChange={event => update({ sort: (event.target as HTMLSelectElement).value })}><option value="priority">위험도순</option><option value="id">ID순</option></select></div>
            </details>
            <div class="v08-rows">{visible.map(item => <article class="v08-row v08-finding-row" key={item.id}>
              <span><button id={`finding-${item.id}`} type="button" class="issue-finding-open" onClick={() => props.selectFinding(item.id)}><strong>{item.title}</strong></button><small>{item.id} · {item.cwe} · {item.type === '취약 사례' ? `위험도 ${item.level}` : reviewLabels[reviews[item.id].status]}</small><SourceLocation file={item.file}/></span>
              <Badge tone={item.color}>{item.type === '취약 사례' ? '취약점 발견' : '확인 필요'}</Badge><button type="button" aria-label={`${item.id} 상세 보기`} onClick={() => props.selectFinding(item.id)}><Icon name="chevron" size={16}/></button>
            </article>)}</div>
            {!visible.length && <div class="v08-notice" role="status"><p>이 조건에 해당하는 판정 항목이 없습니다.</p><Button variant="secondary" onClick={reset}>조건 초기화</Button></div>}
          </section>
          <aside class="v08-well findings-summary">
            <SectionBand title="판정 결과"/><RunFacts rows={options.map(([id,label]) => [label, id === 'missing' ? '— · 규정 미적용' : `${count(id)}개`])}/>
            <p class="v08-note">확인 필요·미판정은 위반율과 등급에서 제외합니다.</p>
            <RouterLink class="v08-link" to="/security?tab=triage">확인 필요 검토</RouterLink>
          </aside>
        </div>
      </main>
    </>
  }
} })
