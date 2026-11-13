import { defineComponent } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { activeConnection } from '../run-context'
import { advanceRun, createRun, runById, runStatus, selectRun, workflow } from '../workflow'
import { RunFacts, SectionBand } from '../components/WorkflowLayout'
import { Badge, Button, Header } from '../ui'

export const Progress = defineComponent({ name: 'Progress', setup() {
  const route = useRoute(), router = useRouter()
  return () => {
    const run = typeof route.query.run === 'string' ? runById(route.query.run) : workflow.runs[0]
    const status = run ? runStatus(run) : ''
    const failed = run?.codeFailed === true
    const partial = run?.design === 'partial'
    const omitted = run?.design === 'omitted'
    const done = run?.step === 4
    const steps = [
      { title: '코드 읽기', text: failed ? '저장소 읽기 권한을 확인할 수 없습니다.' : activeConnection.revision },
      { title: '설계 문서 추출', text: failed ? '코드 접근 실패로 실행하지 않음' : omitted ? '설계 문서 미제공' : partial ? '일부 구역 추출 실패 시연' : '설계 원문·통제 연결 예제' },
      { title: '적용 기준·Rule 준비', text: failed ? '실행 중단' : '예제 기준과 고정 Rule 버전 확인' },
      { title: '코드 진단·스냅샷', text: failed ? '실행 결과 없음' : '공개 표본의 판정과 근거 기록' },
    ]
    const retry = () => {
      if (!run) return
      const id = createRun(run, false, run.id)
      router.push({ path: '/progress', query: { run: id } })
    }
    const open = () => {
      if (run) selectRun(run)
      router.push('/overview')
    }
    return <>
      <Header title="진단 진행" eyebrow={run ? `${run.id} · 공개 예제 시연` : '공개 예제 시연'} actions={<RouterLink class="v08-link" to="/runs">분석 기록</RouterLink>}/>
      <main id="main-content" tabindex={-1} class="content v08-flow">
        {!run ? <section class="v08-stack"><div class="v08-notice"><strong>표시할 실행이 없습니다.</strong><p>새 진단에서 코드 연결을 확인하세요.</p></div><RouterLink to="/new" class="v08-link">새 진단</RouterLink></section>
          : <div class="v08-grid">
            <section><SectionBand title="실행 단계"/><ol class="v08-steps">{steps.map(({ title, text }, index) => {
              const label = failed ? index === 0 ? '실패' : '생략' : index === 1 && omitted ? '생략' : index < run.step ? index === 1 && partial ? '일부 실패' : '완료' : index === run.step ? '현재' : '대기'
              return <li key={title}><span class="v08-step">{String(index + 1).padStart(2, '0')}</span><div><strong>{title}</strong><small>{text}</small></div><Badge tone={label === '실패' ? 'danger' : label === '일부 실패' ? 'warning' : 'neutral'}>{label}</Badge></li>
            })}</ol></section>
            <aside class="v08-stack">
              <div class={['v08-notice', failed ? 'is-danger' : done && partial ? 'is-warning' : '']} role="status"><strong>{status}</strong><p>{failed ? '읽기 권한을 확인한 뒤 다시 연결하세요.' : done ? partial ? '일부 문서 추출 실패를 기록했습니다. 코드 표본 결과를 볼 수 있습니다.' : omitted ? '설계 문서를 생략하고 코드 표본 결과를 생성했습니다.' : '공개 예제 결과를 확인할 수 있습니다.' : '실행 단계와 결과 상태를 순서대로 시연합니다.'}</p></div>
              <section><SectionBand title="실행에 고정된 정보"/><div class="v08-well"><RunFacts rows={[
                ['실행 ID', <code>{run.id}</code>],
                ['코드 버전', activeConnection.revision],
                ['설계 문서', failed ? '추출 생략' : run.documentName || '미제공'],
                ['규정 기준', run.criterionIds.length ? `예제 ${run.criterionIds.length}개` : '미선택'],
                ['Rule 묶음', '공개 표본 Rule v1 · 시연'],
                ['이전 시도', run.retryOf ? <code>{run.retryOf}</code> : '첫 시도'],
              ]}/></div></section>
              <div class="v08-actions">{failed ? <><Button onClick={retry}>예제로 다시 시도</Button><RouterLink class="v08-link" to="/new">연결 설정</RouterLink></> : done ? <Button onClick={open}>결과 보기</Button> : <Button onClick={() => advanceRun(run)}>다음 단계</Button>}</div>
            </aside>
          </div>}
      </main>
    </>
  }
} })
