import { defineComponent, ref, toRefs } from 'vue'
import {useRoute} from 'vue-router'
import { RouterLink } from 'vue-router'
import { ruleCatalog } from '../quality'
import { displayDate, latestRuleRevision, requestRuleRevision, validationLabels, type ValidationState } from '../workflow'
import { RunFacts, SectionBand } from '../components/WorkflowLayout'
import { Button, Header } from '../ui'
import { ruleDraft, resetRuleDraft } from '../drafts'
import { ruleCasesTarget, ruleQuery } from '../rule-context'

const messages: Record<ValidationState, string> = {
  pending: '새 버전이 검증 대기 상태입니다.',
  passed: '검증 통과 시연입니다. 보완본의 적용 대상과 시점은 미정입니다.',
  failed: '보완 분기의 검증 실패 시연입니다. 실패한 버전은 적용할 수 없습니다.',
}

export const RuleRevision = defineComponent({
  name: 'RuleRevision',
  props: { id: { type: String, required: true } },
  setup(props) {
    const route = useRoute()
    const { correction, reason, scenario } = toRefs(ruleDraft(props.id))
    const error = ref('')
    function submit(event: Event) {
      event.preventDefault()
      const saved = requestRuleRevision(props.id, correction.value, reason.value, scenario.value)
      error.value = saved ? '' : '보완 내용과 변경 사유를 입력하세요.'
      if (saved) resetRuleDraft(props.id)
    }
    return () => {
      const rule = ruleCatalog.find(item => item.id === props.id)
      const revision = latestRuleRevision(props.id)
      const version = revision?.version || 1
      const criterion = typeof route.query.criterion === 'string' ? route.query.criterion : undefined
      return <>
        <Header title="Rule 보완 요청" eyebrow={rule ? `${rule.id} · ${rule.name}` : '대상 Rule을 확인하세요.'} actions={<><RouterLink class="v08-link" to={ruleCasesTarget(props.id, version, criterion)}>검증 사례 보기</RouterLink><RouterLink class="v08-link" to={{ path: '/rules', query: ruleQuery(props.id, version, criterion) }}>Rule 목록</RouterLink></>}/>
        <main id="main-content" tabindex={-1} class="content v08-flow">
          {!rule ? <div class="v08-notice" role="status">이 ID로 연결된 Rule이 없습니다.</div> : <div class="v08-grid v08-rule-grid">
            <div class="v08-stack">
              <form class="v08-stack" onSubmit={submit}><SectionBand title="보완 요청"/>
                <label class="v08-field"><span>보완 내용</span><textarea id="rule-correction" required maxlength={2000} value={correction.value} placeholder="예: 위임 접근의 검사 조건을 추가해 주세요." onInput={event => { correction.value = (event.target as HTMLTextAreaElement).value }}/></label>
                <label class="v08-field"><span>변경 사유</span><input id="rule-reason" required maxlength={500} value={reason.value} placeholder="예: 위임 업무의 접근 조건을 명시해야 합니다." onInput={event => { reason.value = (event.target as HTMLInputElement).value }}/></label>
                <label class="v08-field"><span>검증 시나리오 · 공개 예제 시연</span><select id="rule-validation-scenario" value={scenario.value} onChange={event => { scenario.value = (event.target as HTMLSelectElement).value as ValidationState }}>
                  <option value="pending">검증 대기</option><option value="passed">검증 통과</option><option value="failed">검증 실패</option>
                </select></label>
                <div class="v08-actions"><Button type="submit">보완 요청 보내기</Button></div>
                {error.value && <p class="v08-notice is-danger" role="alert">{error.value}</p>}
              </form>
              <section class="v08-version-diff"><SectionBand title="버전 차이"/><RunFacts rows={[
                ['현재 v1', rule.description], ['보완 내용', revision?.correction || '아직 요청하지 않음'], ['영향', 'Rule 구문·사례·실행 가능성 재검증'],
              ]}/></section>
            </div>
            <aside class="v08-stack">
              <section class="v08-validation"><SectionBand title="자동 재검증"/>
                <div id="validation-result" role="status">
                  <div class={['v08-notice', revision?.state === 'failed' ? 'is-danger' : revision?.state === 'pending' ? 'is-warning' : '']}><strong>{revision ? validationLabels[revision.state] : '요청 전'}</strong><p>{revision ? `v${revision.version} · ${messages[revision.state]}` : '요청하면 별도 Rule 버전의 검증 상태를 표시합니다.'}</p></div>
                  {revision && <RunFacts rows={[
                    ['요청자', '시연 사용자'], ['기록 시각', displayDate(revision.createdAt)], ['변경 사유', revision.reason],
                  ]}/>}
                </div>
              </section>
              <section class="v08-existing-run"><SectionBand title="기존 실행"/><div class="v08-well"><RunFacts rows={[
                ['실행에 고정된 버전', `${rule.id} v1`], ['보완본 적용', '이 실행에 적용되지 않음'], ['저장 위치', '이 브라우저 세션'],
              ]}/></div></section>
            </aside>
          </div>}
        </main>
      </>
    }
  },
})
