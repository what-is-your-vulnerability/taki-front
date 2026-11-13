import { resultHref } from '../navigation'
import { defineComponent, ref } from 'vue'
import { DisclosureCue, Header, Button, Icon } from '../ui'
import { activeConnection } from '../run-context'
import { formatViolationRate, publicJudgmentSample, summarizeJudgments } from '../judgments'
import { findings } from '../data'
import { gradeDescriptions, matchesGrade, securityGrade, securityGrades, type GradeFilter } from '../security-grade'

const countLabel = (value: number | null) => value === null ? '—' : value.toLocaleString('ko-KR')

export const Projects = defineComponent({
  name: 'Projects', props: ['go'],
  setup(props) {
    const query = ref(''), starred = ref(false), onlyStars = ref(false)
    const gradeFilter = ref<GradeFilter>('all')
    const resetFilters = () => { query.value = ''; onlyStars.value = false; gradeFilter.value = 'all' }
    return () => {
      const isSample = activeConnection.mode === 'example'
      const snapshot = isSample ? publicJudgmentSample : null
      const result = summarizeJudgments(snapshot)
      const grade = securityGrade(snapshot, findings)
      const inSearch = activeConnection.project.toLowerCase().includes(query.value.trim().toLowerCase()) && (!onlyStars.value || starred.value)
      const visible = inSearch && matchesGrade(grade, gradeFilter.value)
      const filters: { value: GradeFilter; label: string }[] = [{ value: 'all', label: '전체' }, ...securityGrades.map(value => ({ value, label: value })), { value: 'unmeasured', label: '미측정' }]
      const rate = formatViolationRate(result.violationRate)
      const blockUnavailable = (event: MouseEvent) => { if (!result.available) event.preventDefault() }
      return <>
        <Header title="프로젝트" actions={<Button icon="plus" onClick={() => props.go('connect')}>GitHub 저장소 연결</Button>}/>
        <main id="main-content" tabindex={-1} class="content project-catalog">
          <div class="catalog-toolbar">
            <label class="search"><Icon name="search"/><input aria-label="프로젝트 검색" placeholder="프로젝트 검색" value={query.value} onInput={(event: Event) => query.value = (event.target as HTMLInputElement).value}/></label>
            <button class="plain-control" aria-pressed={onlyStars.value} onClick={() => onlyStars.value = !onlyStars.value}>즐겨찾기만</button>
            <span role="status">{isSample ? '공개 예제' : '프로젝트'} {visible ? 1 : 0} / 1개</span>
          </div>
          <div class="project-grade-toolbar">
            <div class="project-grade-filters" role="group" aria-label="보안 등급 필터">
              <span class="project-grade-filter-label">보안 등급</span>
              {filters.map(filter => <button key={filter.value} type="button" aria-pressed={gradeFilter.value === filter.value} aria-label={`${filter.label === '전체' ? '모든 보안 등급' : `보안 등급 ${filter.label}`} 필터`} onClick={() => gradeFilter.value = filter.value}><span>{filter.label}</span><small>{inSearch && matchesGrade(grade, filter.value) ? 1 : 0}</small></button>)}
            </div>
            <details class="project-grade-guide"><summary class="disclosure-summary"><span>등급 기준</span><DisclosureCue/></summary><div><p>확정 취약점의 최고 위험도로 구분합니다. 확인 필요는 제외합니다.</p><dl>{securityGrades.map(value => <div key={value}><dt>{value}</dt><dd>{gradeDescriptions[value]}</dd></div>)}</dl><p>공개 예제의 등급은 수동 검토 표본에만 해당합니다. 분석 근거가 없거나 불완전하면 미측정으로 표시합니다.</p></div></details>
          </div>
          {visible ? <div class="project-rows" role="list" aria-label="프로젝트 목록">
            <article class="project-row" role="listitem" aria-label={activeConnection.project}>
              <div class="project-row-info">
                <button type="button" class="project-favorite" aria-pressed={starred.value} aria-label={starred.value ? '즐겨찾기 해제' : '즐겨찾기 추가'} title={starred.value ? '즐겨찾기 해제' : '즐겨찾기 추가'} onClick={() => starred.value = !starred.value}><Icon name="star" size={20}/></button>
                <div class="project-row-description">
                  <a class="project-row-title" href={resultHref('/overview')}><h2>{activeConnection.project}</h2></a>
                  <p class="project-row-path">juice-shop/juice-shop · {activeConnection.revision}</p>
                  <span>{isSample ? '공개 예제 · 수동 검토' : '코드베이스 연결'}</span>
                </div>
              </div>
              <div class="project-row-metrics">
                <a class="project-row-metric project-row-grade" href={resultHref('/measures')} aria-label={`보안 등급 ${grade ?? '미측정'}, ${grade ? isSample ? '표본 기준' : '분석 기준' : '분석 근거 없음'}`}>
                  <span class="project-row-label">보안 등급</span><div class="project-row-values"><strong class={grade === 'D' || grade === 'E' ? 'plain-risk' : ''}>{grade ?? '—'}</strong></div><small class="project-row-note">{grade ? isSample ? '표본 기준' : '분석 기준' : '미측정'}</small>
                </a>
                <div class="project-row-metric project-row-violation">
                  <span class="project-row-label">위반 / 판정 완료</span>
                  <div class="project-row-values" aria-label={`판정 완료 ${countLabel(result.inventoryComplete ? result.judged : null)}개 중 위반 ${countLabel(result.inventoryComplete ? result.violated : null)}개, 위반율 ${rate}`}>
                    <strong class={result.violated ? 'plain-risk' : ''}>{countLabel(result.inventoryComplete ? result.violated : null)}</strong><span>/ {countLabel(result.inventoryComplete ? result.judged : null)}개</span>
                  </div>
                  {result.violationRate !== null ? <>
                    <div class="project-row-bar" role="img" aria-label={`위반 ${result.violated}개, 충족 ${result.satisfied}개. 위반율 ${rate}`}>
                      {!!result.violated && <span class="judgment-violated" style={{ flex: result.violated }}/>}
                      {!!result.satisfied && <span class="judgment-satisfied" style={{ flex: result.satisfied }}/>}
                    </div>
                    <div class="project-row-rate"><span>{rate}</span><small>{isSample ? '표본 기준' : '위반율'}</small></div>
                  </> : <small class="project-row-note">비율 집계 대기</small>}
                </div>
                <a class="project-row-metric project-row-review" href={resultHref('/security?tab=triage')} aria-disabled={!result.available} tabindex={result.available ? undefined : -1} onClick={blockUnavailable}>
                  <span class="project-row-label">확인 필요</span><div class="project-row-values"><strong>{countLabel(result.needsReview)}</strong><span>개</span></div><small class="project-row-note">비율 제외</small>
                </a>
                <a class="project-row-metric project-row-findings" href={resultHref('/findings?type=vulnerability')} aria-disabled={!result.available} tabindex={result.available ? undefined : -1} onClick={blockUnavailable}>
                  <span class="project-row-label">발견 건수</span><div class="project-row-values"><strong>{countLabel(result.findings)}</strong><span>건</span></div><small class="project-row-note">코드 위치 기준</small>
                </a>
                <div class="project-row-metric project-row-gate"><span class="project-row-label">Quality Gate</span><div class="project-row-values"><span>판정 대기</span></div></div>
              </div>
              <a class="project-row-open" href={resultHref('/overview')} aria-label={`${activeConnection.project} 프로젝트 열기`}><span>열기</span><Icon name="arrow" size={18}/></a>
            </article>
          </div> : <section class="plain-empty" role="status"><h2>일치하는 프로젝트가 없습니다</h2><p>검색어 또는 등급·즐겨찾기 조건을 변경하세요.</p><Button variant="secondary" onClick={resetFilters}>조건 초기화</Button></section>}
        </main>
      </>
    }
  },
})
