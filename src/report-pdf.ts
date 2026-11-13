import { serviceName } from './brand'
import serviceLogoSvg from './assets/brand/logo-c.svg?raw'
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces'
import type { Finding } from './data'
import { buildReportModel, type ReportContext, type ReportFinding, type ReportModel } from './report-model'

const ink = '#202124', muted = '#5b5d60', risk = '#b4232d'
const clean = (value: string) => value.replace(/[\u2010-\u2015\u2212]/g, '-')
// Display wraps keep long code tokens and paths inside the printable width.
const wrap = (value: string) => clean(value).replace(/[^\s]{40,}/gu, token => token.match(/.{1,20}/gu)!.join('\n'))
const text = (value: string, extra: object = {}): Content => ({text:wrap(value), margin:[0,0,0,5], ...extra})
const meta = (value: string): Content => text(value, {style:'meta'})
const heading = (value: string): Content => ({text:value, style:'section', headlineLevel:2, margin:[0,10,0,6]})
const shortPath = (value: string) => value.length > 68 ? `${value.slice(0,24)} … ${value.slice(-30)} (경로 축약)` : value
const origin = (item: ReportFinding, compact = false): Content => ({text:wrap(`원본 코드 - ${compact ? shortPath(item.file) : item.file}`), link:item.sourceUrl, decoration:'underline', style:'meta', margin:[0,4,0,8]})

function findingDetail(item: ReportFinding, report: ReportModel): Content[] {
  const label = (value: string) => heading(`${item.id} · ${value}`)
  const code: Content[] = [
    label('코드 근거'), text(`${item.file} | ${report.version} 참고 위치`, {bold:true}),
    {text:wrap(item.code),fontSize:9.5,lineHeight:1.2,margin:[0,4,0,8]},
    meta('설명용 축약 코드 - 원본 행 번호는 원본에서 확인'),origin(item),
  ]
  const flow: Content[] = [label('코드 흐름'),meta(`입력 ${item.input || '미확인'} → 실행/조회 ${item.sink || '미확인'}`),
    ...item.flow.map((step,i) => text(`${i+1}. ${step.title} - ${step.detail}`)),meta('수동 설명 예제 - 중간 호출 경로 전체 추적 미수행')]
  const reasoning: Content[] = [label('통제와 판단 이유'),text(item.reason),...item.controls.map(control => text(`${control.title} - ${control.detail}`,{fontSize:10}))]
  const action: Content[] = [label(item.type === '확인 필요' ? '추가 확인' : '수정 방향'),text(item.improvement),label('확인할 항목 - 수행 전'),...item.checks.map(check => text(`${check.title} - ${check.detail}`))]
  return [
    {text:`${item.id} · ${clean(item.title)}`,style:'pageTitle',pageBreak:'before',headlineLevel:1},
    meta(`${item.type === '확인 필요' ? '확인 필요 - 등급에서 제외' : `위험도 ${item.level}`} | ${item.cwe}${item.determining ? ' | 등급 결정 취약점' : ''}`),
    meta(`판정 기준: ${item.criteria.map(criterion => `${criterion.id} ${criterion.title}`).join(' / ') || '근거 미연결'}`),
    {columns:report.verification.map(state => ({width:'*',stack:[meta(state.label),text(state.value,{fontSize:9.5})]})),columnGap:14,margin:[0,8,0,4]},
    label('예상 업무 영향'),text(item.impact || '영향 미확인'),meta('공격 조건·실제 피해는 별도 검증이 필요합니다.'),
    {columns:[{width:'*',stack:code},{width:'*',stack:flow}],columnGap:24},
    {columns:[{width:'*',stack:reasoning},{width:'*',stack:action}],columnGap:24},
    ...item.policies.flatMap(policy => [label(`연결된 규정 ${policy.id}`),meta(`${report.policyExample.title} | ${report.policyExample.version} | 실제 사내 규정 아님`),text(`원문: ${policy.original}`),text(`조건: ${policy.condition}`),text(`예외: ${policy.exception}`),text(`범위: ${policy.scope}`),meta(policy.limitation)]),
    {text:`CWE 기준 - ${item.cwe}`,link:item.cweUrl,decoration:'underline',style:'meta',margin:[0,10,0,0]},
  ]
}

export function buildPdfReportFromModel(report: ReportModel): TDocumentDefinitions {
  const n = (value: number | null) => value === null ? '—' : String(value)
  const content: Content[] = [
    {text:'웹 소스코드 보안 진단', style:'title'},
    text(`${report.project} | ${report.version}`, {fontSize:12,margin:[0,8,0,6]}),
    meta(`문서 생성 ${report.issuedLabel} (KST) - 분석 실행일과 별도`),
    text(report.scope, {bold:true,color:risk,margin:[0,4,0,18]}),
    {columns:[
      {width:'*',stack:[meta('보안 등급'),text(report.assessment.grade || '미측정',{fontSize:report.assessment.grade ? 32 : 20,color:['D','E'].includes(report.assessment.grade || '') ? risk : ink}),meta(report.assessment.grade ? report.gradeScope : '근거 연결 대기')]},
      {width:'*',stack:[meta('위반 / 판정 완료'),text(`${n(report.summary.violated)} / ${n(report.summary.judged)}`,{fontSize:24,color:risk}),meta(`${report.rateLabel} - 위반율`)]},
      {width:'*',stack:[meta('확인 필요'),text(n(report.summary.needsReview),{fontSize:24}),meta('등급·비율에서 제외')]},
      {width:'*',stack:[meta('발견 건수'),text(`${n(report.summary.findings)}건`,{fontSize:24}),meta('위반 연결 ID 기준')]},
    ], columnGap:16, margin:[0,0,0,8]},
    meta('위반율 = 위반 / (위반 + 충족). 확인 필요·미판정은 분모에서 제외합니다.'),
    heading(`등급 결정 취약점 ${report.causes.length}건`),
    ...report.causes.slice(0,2).flatMap(item => [
      text(`${item.id} · ${item.title}`, {bold:true}),
      meta(`${item.level} | ${item.cwe} | 근거 위치 ${shortPath(item.file)}`),
      text(`예상 영향: ${item.impact}`), origin(item,true),
    ]),
    ...(report.causes.length > 2 ? [meta(`동일 등급 결정 취약점 ${report.causes.length-2}건은 상세에 포함합니다. 전체 경로는 각 취약점 상세에서 확인하세요.`)] : []),
    ...(!report.causes.length ? [text(report.assessment.grade ? '등급을 낮추는 확정 취약점이 없습니다.' : '분석 근거가 연결되면 등급과 결정 취약점을 표시합니다.')] : []),
    meta('확인 필요 항목은 등급에서 제외합니다. 이 등급은 운영 환경 전체의 안전을 보증하지 않습니다.'),
    heading('우선 조치'),
    ...report.causes.slice(0,2).map(item => text(`${item.id} - ${item.improvementTitle}`)),
    heading('검증 수준'),
    meta(report.verification.map(state => `${state.label}: ${state.value}`).join(' | ')),
    {text:'분석 범위',style:'pageTitle',pageBreak:'before',headlineLevel:1},
    meta('요약 - 대상과 수행 범위'),
    {layout:'noBorders', table:{widths:[110,'*'],dontBreakRows:true,body:report.scopeEntries.map(entry => [
      {text:entry.label,style:'meta',margin:[0,0,0,10]},
      {text:wrap(entry.label === '참고한 근거 파일' ? `${report.files.length}개 · ${report.files.slice(0,3).map(shortPath).join(', ')}${report.files.length > 3 ? ' · 나머지는 상세 참고' : ''}` : entry.value),margin:[0,0,0,10]},
    ])}},
    heading('선택 자료와 규정'),
    ...(report.selectedCriteria.length ? [
      meta(`${report.policyExample.title} | ${report.policyExample.version} | 실제 사내 규정 아님`),
      ...report.selectedCriteria.map(policy => text(`${policy.id} · ${policy.title}`,{bold:true})),
      meta('선택 예제 - 실제 자동 적용 미수행. 원문·조건·예외는 연결된 취약점 상세에 표시합니다.'),
    ] : [text('선택한 규정 기준 없음')]),
    heading('범위 해석'),
    text('참고 파일 수는 전체 저장소 파일 수나 분석 완료율이 아닙니다. 제외 설정과 미분석 영역은 구분합니다.'),
    text('설계문서·규정은 선택 상태만 기록하며 실제 내용 분석·자동 적용 완료로 표현하지 않습니다.'),
    heading('분석 한계'), ...report.limitations.map(value => text(`• ${value}`)),
    ...report.confirmed.flatMap((item, i) => {
      const detail = findingDetail(item,report)
      if (i === 0) detail[0] = {stack:[{text:'취약점 상세',style:'meta'},text(`${item.id} · ${item.title}`,{style:'pageTitle'})],pageBreak:'before'}
      return detail
    }),
    ...report.questions.flatMap((item,i) => {
      const detail = findingDetail(item,report)
      if (i === 0) detail[0] = {stack:[{text:'추가 확인 - 등급·발견 건수에서 제외',style:'meta'},text(`${item.id} · ${item.title}`,{style:'pageTitle'})],pageBreak:'before'}
      return detail
    }),
  ]
  return {
    pageSize:'A4',pageMargins:[48,54,48,64],
    info:{title:`${serviceName} - ${report.project} ${report.version} 보안 진단 리포트`,author:serviceName,subject:report.scope,keywords:`${serviceName}, 보안 진단, 표본 리포트`},
    defaultStyle:{font:'NotoKR',fontSize:10.5,lineHeight:1.2,color:ink},
    styles:{title:{fontSize:24,bold:true},pageTitle:{fontSize:18,bold:true,margin:[0,0,0,12]},section:{fontSize:12,bold:true},meta:{fontSize:9.5,color:muted,lineHeight:1.2}},
    header:{columns:[{svg:serviceLogoSvg,width:104},{text:'보안 진단 리포트',font:'NotoKR',fontSize:9,color:muted,margin:[12,4,0,0]}],margin:[48,19,48,0]},
    footer:(page,pages) => ({margin:[48,10,48,0],fontSize:8.5,color:muted,stack:[
      {columns:[{text:`${report.project} | ${report.version}`,width:'*'},{text:`${page} / ${pages}`,alignment:'right',width:50}]},
      {text:report.scope,margin:[0,4,0,0]},
    ]}),
    pageBreakBefore:(node,container) => !!node.headlineLevel && !container.getFollowingNodesOnPage().length,
    content,
  }
}

export function buildPdfReport(items: Finding[], version: string, withDocument: boolean, context: ReportContext = {}, issuedAt = new Date()): TDocumentDefinitions {
  return buildPdfReportFromModel(buildReportModel(items,version,withDocument,context,issuedAt))
}

let fontFiles: Promise<void> | undefined

export async function createPdfReportBlobFromModel(report: ReportModel): Promise<Blob> {
  const {default:pdfMake} = await import('pdfmake/build/pdfmake')
  const base = new URL(`${import.meta.env.BASE_URL}fonts/noto-sans-kr/`,window.location.href).href
  // Cache only successful font loading; a failed URL load must be retryable.
  fontFiles ??= Promise.all(['Regular','Bold'].map(async weight => {
    const response = await fetch(`${base}NotoSansKR-${weight}.otf`)
    if (!response.ok) throw new Error('PDF font unavailable')
    const bytes = new Uint8Array(await response.arrayBuffer())
    if (String.fromCharCode(...bytes.subarray(0,4)) !== 'OTTO') throw new Error('Invalid PDF font')
    const chunks: string[] = []
    for (let i=0;i<bytes.length;i+=8192) chunks.push(String.fromCharCode(...bytes.subarray(i,i+8192)))
    return [`trace-${weight}.otf`,btoa(chunks.join(''))] as const
  })).then(entries => { pdfMake.addVirtualFileSystem(Object.fromEntries(entries)) }).catch(error => {fontFiles=undefined;throw error})
  await fontFiles
  pdfMake.addFonts({NotoKR:{normal:'trace-Regular.otf',bold:'trace-Bold.otf',italics:'trace-Regular.otf',bolditalics:'trace-Bold.otf'}})
  return pdfMake.createPdf(buildPdfReportFromModel(report)).getBlob()
}

export async function createPdfReportBlob(items: Finding[], version: string, withDocument: boolean, context: ReportContext): Promise<Blob> {
  return createPdfReportBlobFromModel(buildReportModel(items,version,withDocument,context))
}
