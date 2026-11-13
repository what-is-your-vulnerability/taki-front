import { defineComponent, ref } from 'vue'
import {useRoute} from 'vue-router'
import { RunLink as RouterLink } from '../components/RunLink'
import { demo } from '../session'
import { runContext } from '../run-context'
import { publicDesignDocument, selectedRun } from '../workflow'
import { RunFacts, SectionBand } from '../components/WorkflowLayout'
import { findings } from '../data'
import { reviews, saveReview, reviewLabels, type ReviewStatus } from '../triage'
import { Header, Button, Icon } from '../ui'
const TriageReview=defineComponent({name:'SecurityReview',props:['selectFinding'],setup(props){
 const item=findings.find(f=>f.type==='확인 필요')!,status=ref<ReviewStatus>(reviews[item.id].status),note=ref(reviews[item.id].note),message=ref('')
 function save(){message.value=saveReview(item.id,{status:status.value,note:note.value})?'시연 메모를 이 세션에 저장했습니다. 취약점 판정은 변경되지 않습니다.':'검토 기록을 남기려면 근거 메모를 입력하세요.'}
 return()=> <><Header title="확인 필요 검토" actions={<RouterLink class="v08-link" to="/security">설계 검토</RouterLink>}/><main id="main-content" tabindex={-1} class="content"><div class="review-workspace"><aside class="review-queue"><div class="widget-heading"><h2>확인 필요</h2><span>{findings.filter(f=>f.type==='확인 필요').length}개</span></div><div class="review-queue-row" aria-current="true"><span class="plain-review">정책 확인</span><strong>{item.title}</strong><small>{item.file}</small><span class="review-status">{reviewLabels[reviews[item.id].status]}</span></div><p>추가 근거가 필요한 항목입니다. 취약점 합계에서 제외합니다.</p></aside><article class="review-evidence"><div class="widget-heading"><div><span class="issue-id">{item.id}</span><h2>{item.title}</h2></div><Button variant="secondary" onClick={()=>props.selectFinding(item.id)}>코드 근거</Button></div><div class="review-question"><Icon name="info"/><p>{item.reason}</p></div><section><h3>확인할 내용</h3><ul class="evidence-questions">{item.checks.map(check=><li key={check.title}><strong>{check.title}</strong><span>{check.detail}</span></li>)}</ul></section><form class="review-form" onSubmit={(e:Event)=>{e.preventDefault();save()}}><div class="widget-heading"><h3>검토 기록</h3><span>시연용 · 이 세션에 저장</span></div><label for="review-status">검토 상태</label><select id="review-status" value={status.value} onChange={(e:Event)=>{status.value=(e.target as HTMLSelectElement).value as ReviewStatus;message.value=''}}>{Object.entries(reviewLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select><label for="review-note">근거 메모</label><textarea id="review-note" rows={4} maxlength={2000} value={note.value} placeholder="확인한 정책·코드와 남은 질문을 기록하세요." onInput={(e:Event)=>{note.value=(e.target as HTMLTextAreaElement).value;message.value=''}}/><Button type="submit">검토 기록 저장</Button>{message.value&&<p class="save-feedback" role="status">{message.value}</p>}</form></article></div></main></>
}})

export const SecurityReview = defineComponent({ name: 'SecurityReview', props: ['selectFinding'], setup(props) {
  const route = useRoute()
  return () => {
    if (route.query.tab === 'triage') return <TriageReview selectFinding={props.selectFinding}/>
    const run = selectedRun()
    const omitted = route.query.case === 'none' || (route.query.case !== 'example' && run?.design === 'omitted')
    const document = route.query.case === 'example' ? publicDesignDocument : run?.documentName || (demo.withDocument ? runContext.documentName : '') || publicDesignDocument
    const linked = findings.find(item => item.id === 'TRC-002')!
    return <>
      <Header title="설계 위협·통제 검토" eyebrow="설계 원문과 코드 근거를 함께 확인합니다." actions={<RouterLink class="v08-link" to="/security?tab=triage">확인 필요 검토</RouterLink>}/>
      <main id="main-content" tabindex={-1} class="content v08-flow">
        <div class="v08-grid">
          <div class="v08-stack">
            <section><SectionBand title="위협과 통제"/>
              {omitted ? <div class="v08-notice"><strong>설계 검토 생략</strong><p>이 실행에는 설계 문서를 제공하지 않았습니다. 코드 판정과 Rule 보완은 계속 이용할 수 있습니다.</p></div> : <div class="v08-rows">
                <RouterLink to="/findings/TRC-002" class="v08-row"><span><strong>다른 사용자의 장바구니 조회</strong><small>위협 T-03 · 설계 예제 §3.2</small></span><span class="d2-badge violated">취약 사례</span><Icon name="chevron" size={16}/></RouterLink>
                <RouterLink to="/criteria/CR-001" class="v08-row"><span><strong>장바구니 소유 관계 확인</strong><small>통제 AC-02 · 설계 예제 §3.2</small></span><span class="d2-badge needs-review">코드 대조 필요</span><Icon name="chevron" size={16}/></RouterLink>
                <RouterLink to="/security?tab=triage" class="v08-row"><span><strong>관리자 예외 범위 확인</strong><small>통제 AC-03 · 별도 업무 정책</small></span><span class="d2-badge needs-review">확인 필요</span><Icon name="chevron" size={16}/></RouterLink>
              </div>}
            </section>
            {!omitted && <section><SectionBand title="설계 원문과 코드"/><div class="v08-well"><RunFacts rows={[
              ['설계 선택', document], ['설계 원문 예제', '본인 소유 장바구니만 조회 · §3.2'],
              ['코드 근거', <RouterLink class="v08-link" to="/code-report/TRC-002">{linked.file}</RouterLink>],
              ['통제 해석 예제', '객체 ID와 요청자 소유 관계를 함께 확인'],
              ['검증 수준', '예제 설계와 수동 코드 표본 · 실제 문서 분석 미수행'],
            ]}/></div></section>}
          </div>
          <aside class="v08-stack">
            <section><SectionBand title="보완 위치"/><div class="v08-notice"><strong>설계 문서 원본</strong><p>위협·통제 정의를 보완할 때는 문서 관리처에서 원본을 수정합니다.</p></div></section>
            <section><SectionBand title="관련 Rule"/><RouterLink to="/rules?criterion=CR-001" class="v08-row"><span><strong>객체 소유권과 접근 통제</strong><small>TRACE-ACCESS-01 · 공개 표본 Rule</small></span><Icon name="chevron" size={16}/></RouterLink></section>
            <div class="v08-actions"><RouterLink class="v08-link" to={omitted ? '/security?case=example' : '/security?case=none'}>{omitted ? '설계 제공 예시' : '설계 미제공 예시'}</RouterLink><RouterLink class="btn btn-primary" to="/rules/TRACE-ACCESS-01/revise">Rule 보완 요청</RouterLink></div>
          </aside>
        </div>
      </main>
    </>
  }
} })
