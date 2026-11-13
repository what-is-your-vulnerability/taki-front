import { defineComponent, nextTick, ref, watch } from 'vue'
import { RunLink as RouterLink } from '../components/RunLink'
import { currentReport } from '../report-context'
import { shortSourceLocation } from '../source-location'
import { RunFacts, SectionBand } from '../components/WorkflowLayout'
import { DisclosureCue, Header, Icon } from '../ui'
import { CodeViewer, type EvidenceExcerptLine } from './CodeViewer'
import { CodeFlow, ImpactContent, VerificationLevels } from './FindingEvidence'

interface SourceExcerpt {
  lines: readonly EvidenceExcerptLine[]
  steps: readonly { title: string; detail: string; line: number }[]
}

// Only used with the pinned Juice Shop sample. Existing report/PDF summaries use their own evidence model.
const excerpts: Record<string, SourceExcerpt> = {
  'TRC-001': {
    lines: [
      { number: 31, step: 2, text: 'models.sequelize.query(' },
      { step: 1, text: "  `SELECT * FROM Users WHERE email = '" },
      { step: 0, text: "  ${req.body.email || ''}' […]`, […])", mark: 'req.body.email' },
    ],
    steps: [
      { title: '요청 입력', detail: '요청 본문에서 이메일을 읽음', line: 31 },
      { title: '조건에 결합', detail: '값을 WHERE 조건에 직접 삽입', line: 31 },
      { title: '쿼리 실행', detail: '문자열을 sequelize.query에 전달', line: 31 },
    ],
  },
  'TRC-002': {
    lines: [
      { number: 16, step: 0, text: 'const id = req.params.id', mark: 'req.params.id' },
      { number: 17, step: 1, text: 'BasketModel.findOne({ where: { id }, […] })', mark: '{ id }' },
      { text: '[…]' },
      { number: 29, step: 2, text: 'res.json(utils.queryResultToJson(basket))' },
    ],
    steps: [
      { title: '객체 ID 입력', detail: '요청 경로에서 장바구니 ID를 읽음', line: 16 },
      { title: '객체 조회', detail: '소유 관계를 조건에 넣지 않고 ID로 조회', line: 17 },
      { title: '응답 반환', detail: '조회 결과를 JSON으로 반환', line: 29 },
    ],
  },
}

export const CodeReport = defineComponent({ name: 'CodeReport', props: { id: { type: String, required: true } }, setup(props) {
  const stage = ref(0), evidenceSection = ref<HTMLElement | null>(null)
  const issuedAt = new Date()
  watch(() => props.id, () => { stage.value = 0 })
  const showStage = async (index: number) => {
    stage.value = index
    await nextTick()
    evidenceSection.value?.querySelector('.evidence-source-line.active')?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }

  return () => {
    const report = currentReport(issuedAt)
    const item = report.confirmed.find(finding => finding.id === props.id)
    const excerpt = item && report.sample && report.version === 'v19.0.0' ? excerpts[item.id] : undefined
    return <><Header title="코드 근거 리포트" eyebrow={`${report.project} / ${report.version}`} actions={item && <RouterLink class="btn btn-secondary" to={`/findings/${item.id}`}>이슈로 돌아가기</RouterLink>}/>
      <main id="main-content" tabindex={-1} class="content code-report-page v08-flow">
        <div class="code-report-context"><span class="d2-muted">{report.scope}</span><span class="code-report-grade">보안 등급 {report.assessment.grade ?? '미측정'}{report.assessment.grade && ` · ${report.gradeScope}`}</span></div>
        {item ? <>
          <div class="v08-grid">
            <article class="v08-stack">
              <section ref={evidenceSection} aria-labelledby="code-report-source">
                <div class="v08-band"><h2 id="code-report-source">코드 위치</h2><a class="v08-link" href={item.sourceUrl} target="_blank" rel="noreferrer">원본 코드 <Icon name="link" size={14}/></a></div>
                <div class="code-report-section-body"><CodeViewer key={item.id} code={item.code} label="근거 코드" file={item.file} version={report.version} lines={excerpt?.lines} activeStep={stage.value}/><p class="d2-muted">{excerpt ? '고정 버전의 원본 발췌 · 줄바꿈 및 일부 생략' : '설명용 축약 코드 · 원본 행 번호는 원본에서 확인'}</p></div>
              </section>
              <section><SectionBand title="호출 순서"/>{excerpt ? <ol class="code-report-steps">{excerpt.steps.map((step, index) => <li key={step.title}><button type="button" aria-pressed={stage.value === index} onClick={() => showStage(index)}><span>{String(index + 1).padStart(2, '0')}</span><span><strong>{step.title}</strong><small class="d2-muted">{step.detail}</small></span><small class="d2-muted">{step.line}행</small></button></li>)}</ol> : <div class="code-report-section-body"><CodeFlow item={item}/></div>}</section>
              <section><SectionBand title="업무 영향"/><ImpactContent item={item}/></section>
              <section><SectionBand title="권장 수정"/><strong>{item.improvementTitle}</strong><p>{item.improvement}</p></section>
            </article>
            <aside class="v08-stack">
              <section><SectionBand title="판정 연결"/><div class="v08-well"><RunFacts rows={[
                ['이슈', <RouterLink class="v08-link" to={`/findings/${item.id}`}>{item.id} · {item.title}</RouterLink>],
                ['판정 / 위험도', `${item.type} · ${item.level}`], ['코드 위치', item.file],
                ['적용 기준', item.criteria.map(criterion => criterion.title).join(' · ') || '미연결'],
              ]}/></div></section>
              <section><SectionBand title="원문과 검증 수준"/><VerificationLevels report={report}/><RunFacts rows={[
                ['설계 원문', report.scopeEntries.find(entry => entry.label === '설계문서')?.value],
                ['판정 이유', item.reason],
              ]}/></section>
              <details class="v08-disclosure"><summary class="disclosure-summary"><span>다른 취약점의 코드 근거</span><DisclosureCue/></summary><nav class="v08-actions" aria-label="코드 리포트 취약점 선택">{report.confirmed.filter(finding => finding.id !== item.id).map(finding => <RouterLink class="v08-link" key={finding.id} to={`/code-report/${finding.id}`}>{finding.id} · {shortSourceLocation(finding.file)}</RouterLink>)}</nav></details>
            </aside>
          </div>
        </> : <section class="plain-empty"><h2>연결된 코드 근거가 없습니다</h2><p>프로젝트 개요에서 확인할 취약점을 선택하세요.</p></section>}
        <nav class="d2-related v08-footer" aria-label="관련 리포트"><RouterLink to="/overview">프로젝트 개요</RouterLink><RouterLink to="/report">전체 리포트 · PDF 다운로드 <Icon name="arrow" size={14}/></RouterLink></nav>
      </main></>
  }
} })
