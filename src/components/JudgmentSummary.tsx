import { defineComponent, ref, type PropType } from 'vue'
import { formatViolationRate, judgmentLabels, summarizeJudgments, type JudgmentSnapshot } from '../judgments'
import { Icon } from '../ui'
import { type SecurityGradeAssessment } from '../security-grade'

const countLabel = (value: number | null) => value === null ? '—' : value.toLocaleString('ko-KR')

export const JudgmentSummary = defineComponent({
  name: 'JudgmentSummary',
  props: {
    snapshot: { type: Object as PropType<JudgmentSnapshot | null>, default: null },
    gradeAssessment: { type: Object as PropType<SecurityGradeAssessment>, default: () => ({ grade: null, determiningFindingIds: [] }) },
  },
  emits: ['showGradeCauses'],
  setup(props, { emit }) {
    const expanded = ref(false)
    return () => {
      const result = summarizeJudgments(props.snapshot)
      const knownTotal = result.inventoryComplete
      const unavailable = !result.available
      const rateText = formatViolationRate(result.violationRate)
      const { grade, determiningFindingIds } = props.gradeAssessment
      return <section class="judgment-summary" aria-labelledby="judgment-title">
        <div class="judgment-heading">
          <h2 id="judgment-title">보안 판정 요약</h2>
          <p>{props.snapshot?.scopeLabel || '전체 판정 결과 연결 대기'}</p>
          <div class="judgment-grade" aria-label={`보안 등급 ${grade ?? '미측정'}`}>
            <span>보안 등급</span><strong class={grade === 'D' || grade === 'E' ? 'plain-risk' : ''}>{grade ?? '—'}</strong>
            <small>{grade ? props.snapshot?.source === 'manual-sample' ? '표본 기준' : '분석 기준' : '미측정'}</small>
            {!!determiningFindingIds.length && <button type="button" aria-controls="grade-causes" aria-label={`등급 결정 취약점 ${determiningFindingIds.length}건 보기`} onClick={() => emit('showGradeCauses')}>결정 근거 {determiningFindingIds.length}건<Icon name="arrow" size={14}/></button>}
          </div>
        </div>
        <div class="judgment-counts">
          <div class={['judgment-main', result.violated === 0 && 'is-clean']}>
            <span>위반 / 판정 완료</span>
            <div class="judgment-value" aria-label={`판정 완료 ${countLabel(knownTotal ? result.judged : null)}개 중 위반 ${countLabel(knownTotal ? result.violated : null)}개, 위반율 ${rateText}`}>
              <strong>{countLabel(knownTotal ? result.violated : null)}</strong>
              <span>/ {countLabel(knownTotal ? result.judged : null)}개</span>
            </div>
            <small class="judgment-ratio-label">위반율 <strong class="judgment-rate">{rateText}</strong></small>
          </div>
          <a class="judgment-related" href="#/security?tab=triage" aria-disabled={unavailable} tabindex={unavailable ? -1 : undefined} onClick={(event: MouseEvent) => { if (unavailable) event.preventDefault() }}>
            <span>확인 필요</span>
            <strong>{countLabel(result.needsReview)}<small>개</small></strong>
            <small>비율에서 제외</small>
          </a>
          <a class="judgment-related" href="#/findings?type=vulnerability" aria-disabled={unavailable} tabindex={unavailable ? -1 : undefined} onClick={(event: MouseEvent) => { if (unavailable) event.preventDefault() }}>
            <span>발견 건수</span>
            <strong>{countLabel(result.findings)}<small>건</small></strong>
            <small>코드 위치 기준</small>
          </a>
        </div>
        {result.violationRate !== null ? <div class="judgment-distribution" role="img" aria-label={`판정 완료 ${result.judged}개: 위반 ${result.violated}개, 충족 ${result.satisfied}개. 위반율 ${rateText}`}>
          {!!result.violated && <span class="judgment-violated" style={{ flex: result.violated }}/>}
          {!!result.satisfied && <span class="judgment-satisfied" style={{ flex: result.satisfied }}/>}
        </div> : <p class="judgment-pending" role="status">{unavailable ? '판정 자료가 연결되면 위반 수와 비율을 표시합니다.' : !knownTotal ? '일부 판정만 수집되어 비율을 보류했습니다.' : '아직 판정이 완료된 항목이 없습니다.'}</p>}
        <div class="judgment-key">
          <div class="judgment-legend">
            <span><i class="judgment-violated"/>위반 {countLabel(result.violated)}개</span>
            <span><i class="judgment-satisfied"/>충족 {countLabel(result.satisfied)}개</span>
            {!!result.unassessed && <span>미판정 {result.unassessed}개 · 비율 제외</span>}
          </div>
          <button type="button" aria-expanded={expanded.value} aria-controls="judgment-items" disabled={unavailable} onClick={() => expanded.value = !expanded.value}>
            판정 항목 {countLabel(result.total)}개 {expanded.value ? '접기' : '보기'}<Icon name="chevron" size={16}/>
          </button>
        </div>
        <div id="judgment-items" class="judgment-items" hidden={!expanded.value}>
          <p>동일 기준은 한 항목으로 셉니다. 확인 필요·미판정은 비율에서 제외하고, 코드 발견은 별도 건수로 집계합니다.</p>
          {result.items.map(item => <div class="judgment-item" key={item.id}>
            <span><strong>{item.title}</strong><small>{item.id}</small></span>
            <span class={item.outcome === 'violated' ? 'plain-risk' : item.outcome === 'needs-review' ? 'plain-review' : ''}>{judgmentLabels[item.outcome]}</span>
            <span class="judgment-evidence">{item.findingIds.map(id => <a key={id} href={`#/findings/${id}`}>{id}<Icon name="arrow" size={14}/></a>)}</span>
          </div>)}
        </div>
      </section>
    }
  },
})
