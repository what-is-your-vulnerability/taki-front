import { defineComponent } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { activeConnection } from '../run-context'
import { displayDate, runStatus, selectRun, usePublicSample, workflow, type DemoRun } from '../workflow'
import { RunFacts, SectionBand } from '../components/WorkflowLayout'
import { DisclosureCue, Badge, Button, Header, Icon } from '../ui'

export const Tasks = defineComponent({ name: 'Tasks', setup() {
  const router = useRouter()
  const open = (run: DemoRun) => {
    if (run.codeFailed || run.step < 4) router.push({ path: '/progress', query: { run: run.id } })
    else { selectRun(run); router.push('/overview') }
  }
  return () => <>
    <Header title="분석 기록" eyebrow={activeConnection.project} actions={<Button onClick={() => router.push('/new')}>새 진단</Button>}/>
    <main id="main-content" tabindex={-1} class="content v08-flow run-history-page">
      <div class="run-history-content">
        <section>
          <SectionBand title={`실행 기록 ${workflow.runs.length + 1}건`}/>
          <div class="v08-rows">{workflow.runs.map(run => <button key={run.id} type="button" class="v08-row" onClick={() => open(run)}>
            <span><strong><code>{run.id}</code></strong><small>{displayDate(run.createdAt)} · {activeConnection.revision}{run.retryOf ? ` · ${run.retryOf} 재시도` : ''}</small></span>
            <Badge tone={run.codeFailed ? 'danger' : runStatus(run) === '부분 완료' ? 'warning' : 'neutral'}>{runStatus(run)}</Badge><Icon name="chevron" size={16}/>
          </button>)}
            <button type="button" class="v08-row" onClick={() => { usePublicSample(); router.push('/overview') }}><span><strong>기존 공개 표본</strong><small>{activeConnection.revision} · 수동 검토</small></span><Badge>표본</Badge><Icon name="chevron" size={16}/></button>
          </div>
        </section>
        <details class="v08-disclosure run-history-help"><summary class="disclosure-summary"><span>보관·재시도 안내</span><DisclosureCue/></summary><div class="run-history-help-body"><RunFacts rows={[
          ['코드 버전', activeConnection.revision], ['재시도 방식', '이전 실행 ID를 연결한 별도 실행'], ['저장 위치', '이 브라우저 세션 · 공개 예제 시연'], ['보관 기준', '실행 종료부터 30일 · 실제 종료 시각 미연결'],
        ]}/><nav class="v08-actions" aria-label="기존 결과 상태">{[['empty','발견 0건'],['failure','진단 실패'],['partial','문서 부분 실패'],['unsupported','미지원']].map(([id,label]) => <RouterLink key={id} class="v08-link" to={`/preview/${id}`}>{label}</RouterLink>)}</nav></div></details>
      </div>
    </main>
  </>
} })
