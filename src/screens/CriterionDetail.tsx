import { defineComponent } from 'vue'
import {useRoute} from 'vue-router'
import { RunLink as RouterLink } from '../components/RunLink'
import { findings } from '../data'
import { getCriterion, policyExample } from '../policies'
import { RunFacts, SectionBand } from '../components/WorkflowLayout'
import { Badge, Header, Icon } from '../ui'

export const CriterionDetail = defineComponent({ name: 'CriterionDetail', setup() {
  const route = useRoute()
  return () => {
    const criterion = getCriterion(String(route.params.id || ''))
    if (!criterion) return <><Header title="기준을 찾을 수 없습니다"/><main id="main-content" tabindex={-1} class="content v08-flow"><div class="v08-notice" role="status">요청한 기준이 없습니다.</div><RouterLink class="v08-link" to="/criteria">기준 목록</RouterLink></main></>
    const finding = findings.find(item => item.id === criterion.findingId)
    return <>
      <Header title={criterion.title} eyebrow={`${criterion.id} · ${policyExample.title} ${policyExample.version}`} actions={<RouterLink class="v08-link" to="/criteria">기준 목록</RouterLink>}/>
      <main id="main-content" tabindex={-1} class="content v08-flow">
        <div class="v08-grid">
          <div class="v08-stack">
            <section><SectionBand title="규정 원문"/><blockquote class="v08-well">{criterion.original}</blockquote></section>
            <section><SectionBand title="적용 조건"/><RunFacts rows={[
              ['적용 대상', criterion.scope], ['검사 조건', criterion.condition], ['예외', criterion.exception],
            ]}/></section>
          </div>
          <aside class="v08-stack">
            <section><SectionBand title="실행에 연결된 근거"/><div class="v08-well"><RunFacts rows={[
              ['출처', policyExample.source], ['기준 상태', <Badge tone={criterion.state === '확인 필요' ? 'warning' : 'neutral'}>{criterion.state === '확인 필요' ? '개별 보류 예시' : '자동 적용 예시'}</Badge>],
              ['연결 Rule', criterion.rule], ['판정 근거', finding ? `${finding.id} · ${finding.file}` : '위치 미연결'],
            ]}/></div></section>
            <p class="v08-notice">{criterion.limitation}</p>
            <div class="v08-actions"><RouterLink class="btn btn-primary" to={{path:'/rules',query:{criterion:criterion.id}}}>연결 Rule 보기</RouterLink><RouterLink class="v08-link" to={`/findings/${criterion.findingId}`}>관련 이슈</RouterLink></div>
            {finding && <a class="source-link" href={finding.cweUrl} target="_blank" rel="noreferrer">{finding.cwe} 참조 <Icon name="link" size={14}/></a>}
          </aside>
        </div>
      </main>
    </>
  }
} })
