import { defineComponent, ref, computed } from 'vue'
import { agentGateway } from '../agent'
import { criteria, policyExample } from '../policies'
import { ruleCatalog } from '../quality'
import { RunFacts, SectionBand } from '../components/WorkflowLayout'
import { Badge, Button, Header, Icon } from '../ui'

export const Criteria = defineComponent({ name: 'Criteria', props: ['selectCriterion'], setup(props) {
  const file = ref<File | null>(null), version = ref(''), message = ref(''), busy = ref(false), query = ref('')
  const dialog = ref<HTMLDialogElement | null>(null)
  const visible = computed(() => criteria.filter(item => `${item.id} ${item.title} ${item.state}`.toLocaleLowerCase().includes(query.value.trim().toLocaleLowerCase())))
  async function register() {
    if (!file.value || !version.value.trim() || busy.value) return
    busy.value = true
    try {
      const result = await agentGateway.registerPolicy({ name: file.value.name, size: file.value.size, type: file.value.type })
      message.value = result.message
    } catch { message.value = '등록 요청을 처리하지 못했습니다. 연결 후 다시 시도해 주세요.' }
    finally { busy.value = false }
  }
  return () => <>
    <Header title="적용 기준" eyebrow="기본 기준과 규정에서 추출한 기준의 적용 상태입니다." actions={<Button onClick={() => dialog.value?.showModal()}>규정 추가</Button>}/>
    <main id="main-content" tabindex={-1} class="content v08-flow">
      <div class="v08-grid">
        <div class="v08-stack">
          <section><SectionBand title="규정 추출 기준"/>
            <label class="search criteria-search"><Icon name="search"/><input aria-label="진단 기준 검색" placeholder="기준 ID·제목·상태 검색" value={query.value} onInput={event => { query.value = (event.target as HTMLInputElement).value }}/></label>
            <div class="v08-rows">{visible.value.map(item => <button type="button" class="v08-row" key={item.id} onClick={() => props.selectCriterion(item.id)}><span><strong>{item.title}</strong><small>{item.id} · {item.scope}</small></span><Badge tone={item.state === '확인 필요' ? 'warning' : 'neutral'}>{item.state === '확인 필요' ? '개별 보류 예시' : '자동 적용 예시'}</Badge><Icon name="chevron" size={16}/></button>)}</div>
            {!visible.value.length && <p class="v08-notice" role="status">일치하는 기준이 없습니다.</p>}
          </section>
          <section><SectionBand title="기본 기준"/><div class="v08-rows">{ruleCatalog.map(rule => <a class="v08-row" key={rule.id} href={rule.id === 'TRACE-ACCESS-01' ? '#/rules?criterion=CR-001' : '#/rules'}><span><strong>{rule.name}</strong><small>{rule.id} · {rule.language}</small></span><Badge>공개 표본</Badge><Icon name="chevron" size={16}/></a>)}</div></section>
        </div>
        <aside class="v08-stack">
          <section><SectionBand title="규정 원문"/><div class="v08-well"><RunFacts rows={[
            ['문서', policyExample.title], ['버전', policyExample.version],
            ['유효 기준', `${criteria.filter(item => item.state === '적용 예제').length}개 · 적용 예시`],
            ['보류', `${criteria.filter(item => item.state === '확인 필요').length}개 · 예외 범위 확인 필요`],
          ]}/></div></section>
          <div class="v08-notice"><strong>유효 기준은 자동 적용 대상</strong><p>예외나 조건이 모호하면 해당 기준만 보류합니다. 화면은 공개 예제로 동작합니다.</p></div>
        </aside>
      </div>
      <dialog class="v08-dialog" ref={dialog} aria-labelledby="policy-dialog-title">
        <form class="v08-stack" onSubmit={event => { event.preventDefault(); register() }} aria-busy={busy.value}>
          <h2 id="policy-dialog-title">규정 추가</h2>
          <label class="v08-field"><span>규정 문서</span><input id="policy-file" type="file" required onChange={event => { file.value = (event.target as HTMLInputElement).files?.[0] || null; message.value = '' }}/></label>
          <label class="v08-field"><span>문서 버전</span><input id="policy-version" required value={version.value} maxlength={80} onInput={event => { version.value = (event.target as HTMLInputElement).value }}/></label>
          <p class="v08-note">실제 규정 등록은 Agent 연결 후 사용할 수 있습니다.</p>
          <div class="v08-actions"><Button type="submit" disabled={busy.value}>{busy.value ? '등록 요청 중…' : '등록 및 기준 추출'}</Button><Button variant="secondary" onClick={() => dialog.value?.close()}>닫기</Button></div>
          {message.value && <p class="v08-notice" role="status">{message.value}</p>}
        </form>
      </dialog>
    </main>
  </>
} })
