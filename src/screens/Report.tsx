import { reportFileName } from '../brand'
import { defineComponent, nextTick, onMounted, ref, watch } from 'vue'
import { reportMarkdown } from '../domain'
import { currentReport } from '../report-context'
import { Icon, Button, Header, DisclosureCue } from '../ui'
import { ReportDetail } from './ReportDetail'
import { shortSourceLocation } from '../source-location'
import { DiagnosisSummary } from '../components/DiagnosisSummary'
import { reportHtml, reportText } from '../report-export'
import { ResultManagement } from './ResultManagement'

export const Report = defineComponent({ name: 'Report', props: { openManagement: Boolean }, setup(props) {
  const notice = ref(''), pdfBusy = ref(false), pdfError = ref(false)
  const resources = ref<HTMLDetailsElement | null>(null), resourcesOpen = ref(props.openManagement)
  const revealResources = async () => {
    resourcesOpen.value = true
    await nextTick()
    resources.value?.querySelector<HTMLElement>('summary')?.focus({preventScroll:true})
    resources.value?.scrollIntoView({block:'nearest'})
  }
  onMounted(() => { if (props.openManagement) revealResources() })
  watch(() => props.openManagement, open => { if (open) revealResources() })
  const issuedAt = new Date()
  const save = (blob: Blob, filename: string, format: string) => {
    const url = URL.createObjectURL(blob), link = document.createElement('a')
    link.href = url; link.download = filename; link.click()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
    notice.value = `${format} 다운로드를 시작했습니다.`
  }
  const jump = (event: MouseEvent, id: string) => {
    event.preventDefault()
    const element = document.getElementById(id)
    const disclosure = element?.closest('details')
    if (disclosure) disclosure.open = true
    element?.focus({preventScroll:true}); element?.scrollIntoView({block:'start'})
  }
  return () => {
    const report = currentReport(issuedAt)
    const downloadPdf = async () => {
      if (pdfBusy.value) return
      // Capture detached input before loading the PDF engine.
      const captured = report
      pdfBusy.value = true; pdfError.value = false; notice.value = ''
      try {
        const { createPdfReportBlobFromModel } = await import('../report-pdf')
        save(await createPdfReportBlobFromModel(captured), `${reportFileName}.pdf`, 'PDF')
      } catch { pdfError.value = true }
      finally { pdfBusy.value = false }
    }
    return <>
      <Header title="진단 리포트" eyebrow={`${report.project} / ${report.version}`} onMenu={() => {}} actions={<>
        <Button variant="secondary" onClick={revealResources}>다운로드·관리</Button>
        <Button ariaLabel="HTML 리포트 다운로드" onClick={() => save(new Blob([reportHtml(report)], {type:'text/html;charset=utf-8'}), `${reportFileName}.html`, 'HTML')}>HTML 다운로드</Button>
      </>}/>
      <main id="main-content" tabindex={-1} class="content report-layout report-v2 v08-report">
        {notice.value && <div class="toast" role="status"><Icon name="check"/><strong>{notice.value}</strong><button aria-label="알림 닫기" onClick={() => notice.value = ''}><Icon name="close"/></button></div>}
        {pdfError.value && <div class="report-export-error" role="alert"><p>PDF를 만들지 못했습니다. 다시 시도해 주세요.</p><Button variant="secondary" disabled={pdfBusy.value} onClick={downloadPdf}>다시 시도</Button></div>}
        <aside class="report-index" aria-label="리포트 목차"><span>리포트 구성</span>{[
          ['report-summary', '요약'], ['report-scope', '분석 범위'], ['report-details', '취약점 상세'], ['report-questions', '추가 확인'], ['report-limits', '분석 한계'],
        ].map(([id, label]) => <a href={`#${id}`} key={id} onClick={event => jump(event, id)}>{label}</a>)}</aside>
        <article class="report">
          <div class="v08-report-results">
          <section class="report-summary" aria-labelledby="report-summary"><h2 id="report-summary" class="sr-only" tabindex={-1}>보안 판정 요약</h2><DiagnosisSummary report={report}/></section>
          <details class="report-resources" ref={resources} open={resourcesOpen.value} onToggle={event => { resourcesOpen.value = (event.target as HTMLDetailsElement).open }}>
            <summary id="report-resources-title" class="disclosure-summary" aria-expanded={resourcesOpen.value} aria-controls="report-resource-body"><div class="disclosure-title"><h2>다운로드·결과 관리</h2><span>전체 상세 · 30일 보관</span></div><DisclosureCue/></summary>
            <div id="report-resource-body" class="report-resource-body"><section aria-label="리포트 다운로드"><div class="v08-actions">
              <Button variant="secondary" ariaLabel="TXT 리포트 다운로드" onClick={() => save(new Blob([reportText(report)], {type:'text/plain;charset=utf-8'}), `${reportFileName}.txt`, 'TXT')}>TXT</Button>
              <Button variant="secondary" ariaLabel="HTML 리포트 다운로드" onClick={() => save(new Blob([reportHtml(report)], {type:'text/html;charset=utf-8'}), `${reportFileName}.html`, 'HTML')}>HTML</Button>
              <Button variant="secondary" ariaLabel="PDF 리포트 다운로드" disabled={pdfBusy.value} onClick={downloadPdf}>{pdfBusy.value ? 'PDF 생성 중' : 'PDF · 확장'}</Button>
              <Button variant="ghost" ariaLabel="Markdown 리포트 다운로드" onClick={() => save(new Blob([reportMarkdown(report)], {type:'text/markdown;charset=utf-8'}), `${reportFileName}.md`, 'Markdown')}>Markdown</Button>
            </div><p class="report-meta">접힘 상태와 관계없이 전체 상세를 내려받습니다.</p></section><ResultManagement report={report}/></div>
          </details>
          <section class="v08-report-details" aria-labelledby="report-details"><div class="report-section-heading report-details-heading"><h3 id="report-details" tabindex={-1}>취약점 상세 <span>{report.confirmed.length}건</span></h3><p class="report-meta">HTML·TXT와 PDF에는 접힘 상태와 관계없이 전체 상세가 포함됩니다.</p></div>{report.confirmed.length ? report.confirmed.map(item => <ReportDetail key={item.id} item={item} report={report}/>) : <p>연결된 취약점 근거가 없습니다.</p>}</section>
          <section class="v08-report-questions" aria-labelledby="report-questions"><div class="report-section-heading report-details-heading"><h3 id="report-questions" tabindex={-1}>추가 확인 <span>{report.questions.length}건</span></h3><p class="report-meta">정책 질문은 등급·발견 건수·위반율에서 제외합니다.</p></div>{report.questions.length ? report.questions.map(item => <ReportDetail key={item.id} item={item} report={report}/>) : <p>별도의 정책 확인 질문이 없습니다.</p>}</section>
          </div>
          <aside class="v08-report-support" aria-label="등급 및 실행 범위">
          <section class="v08-report-grade" aria-label="보안 등급과 결정 근거">
            <div class="v08-band"><h2>보안 등급 {report.assessment.grade || '—'}</h2><span class="report-meta">{report.assessment.grade ? report.gradeScope : '미측정'}</span></div>
            <div class="report-cause-heading"><h3>등급 결정 취약점 <span>{report.causes.length}건</span></h3><span class="report-meta">{report.assessment.grade ? `최고 위험도 ${report.gradeDescription}` : '근거 연결 대기'}</span></div>
            {report.causes.map(item => <a class="report-cause" href={`#detail-${item.id}`} onClick={event => jump(event, `detail-${item.id}`)} key={item.id}>
              <span class="report-meta">{item.id}</span><span><strong>{item.title}</strong><small>{shortSourceLocation(item.file)} · {item.cwe}</small></span><span class="plain-risk">{item.level}</span><Icon name="arrow" size={16}/>
            </a>)}
            {!report.causes.length && <p>{report.assessment.grade ? '등급을 낮추는 확정 취약점이 없습니다.' : '분석 근거가 연결되면 등급과 결정 취약점을 표시합니다.'}</p>}
            <p class="report-meta report-issued">문서 생성 {report.issuedLabel} (KST) · 분석 실행일과 별도</p>
          </section>
          </aside>
          <div class="report-reference-sections">
          <details class="v08-report-scope report-context-disclosure"><summary class="disclosure-summary"><div class="disclosure-title"><h3 id="report-scope" tabindex={-1}>분석 범위</h3><span>{report.files.length}개 근거 파일 · {report.version}</span></div><DisclosureCue/></summary><dl class="report-scope-list">{report.scopeEntries.map(entry => <div key={entry.label}><dt>{entry.label}</dt><dd>{entry.value}</dd></div>)}</dl>
            <div class="report-priority"><h4>우선 조치</h4>{report.causes.length ? report.causes.map(item => <div key={item.id}><a href={`#detail-${item.id}`} onClick={event => jump(event, `detail-${item.id}`)}>{item.id} · {item.improvementTitle}</a><p>{item.improvement}</p></div>) : <p>판정 근거 연결 후 조치 항목을 표시합니다.</p>}</div>
          </details>
          <details class="v08-report-limits report-context-disclosure"><summary class="disclosure-summary"><div class="disclosure-title"><h3 id="report-limits" tabindex={-1}>분석 한계</h3><span>수동 검토 표본 · 실행·재현 미수행</span></div><DisclosureCue/></summary><ul class="report-limits">{report.limitations.map(text => <li key={text}>{text}</li>)}</ul></details>
          </div>
        </article>
      </main>
    </>
  }
}})
