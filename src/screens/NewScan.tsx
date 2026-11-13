import { defineComponent, ref, toRefs } from 'vue'
import {useRouter} from 'vue-router'
import { RouterLink } from 'vue-router'
import { canStartDiagnosis, exampleDraft } from '../agent'
import { criteria, policyExample } from '../policies'
import { createRun, publicDesignDocument, type DesignState } from '../workflow'
import { RunFacts, SectionBand } from '../components/WorkflowLayout'
import { Button, Header } from '../ui'
import { scanDraft, resetScanDraft } from '../drafts'

export const NewScan = defineComponent({ name: 'NewScan', setup() {
  const router = useRouter()
  const { connection: draft, design, file, includeCriteria } = toRefs(scanDraft)
  const error = ref('')
  if (!draft.value.connection) draft.value = exampleDraft()
  function reset() { resetScanDraft(); draft.value = exampleDraft(); error.value = '' }
  function restoreFile(element: unknown) {
    if (element instanceof HTMLInputElement && file.value && !element.files?.length) {
      const transfer = new DataTransfer(); transfer.items.add(file.value); element.files = transfer.files
    }
  }
  const documentName = () => design.value === 'omitted' ? '' : file.value?.name || publicDesignDocument
  function start(codeFailed = false) {
    if (!codeFailed && !canStartDiagnosis(draft.value)) { error.value = '저장소 연결·READ 권한과 분석 버전을 먼저 확인해 주세요.'; return }
    if (!codeFailed && draft.value.connection?.mode !== 'example') { error.value = '진단 실행 API 연결이 필요합니다.'; return }
    const run = createRun({ design: design.value, documentName: documentName(), criterionIds: includeCriteria.value ? criteria.map(item => item.id) : [] }, codeFailed)
    if (!codeFailed) reset()
    router.push({ path: '/progress', query: { run } })
  }

  return () => <>
    <Header title="새 진단" eyebrow="연결된 프로젝트의 실행 설정 · 공개 예제 시연" actions={<RouterLink to="/runs" class="v08-link">분석 기록</RouterLink>}/>
    <main id="main-content" tabindex={-1} class="content v08-flow">
      <div class="v08-grid">
        <form class="v08-stack" onSubmit={(event: Event) => { event.preventDefault(); start() }}>
          <SectionBand title="연결된 프로젝트"/>
          <label class="v08-field"><span>GitHub 저장소</span>
            <input id="github-repository" readonly value="juice-shop/juice-shop" aria-describedby="connection-help"/>
          </label>
          <p id="connection-help" class="v08-note">v19.0.0 공개 표본입니다. 실제 GitHub App·저장소 전체 READ 연동 전입니다.</p>
          <RouterLink class="v08-link" to="/connect">다른 GitHub 저장소 연결</RouterLink>
          {error.value && <p class="v08-notice is-danger" role="alert">{error.value}</p>}
          <label class="v08-field"><span>브랜치 / 고정 버전</span><input readonly value={draft.value.connection?.revision || '연결 확인 필요'}/></label>
          <label class="v08-field"><span>설계 문서 · 선택</span><select id="design-state" value={design.value} onChange={event => { design.value = (event.target as HTMLSelectElement).value as DesignState }}>
            <option value="omitted">미제공 · 설계 검토 생략</option><option value="provided">설계 문서 제공 시연</option><option value="partial">일부 추출 실패 시연</option>
          </select></label>
          {design.value !== 'omitted' && <label class="v08-field"><span>파일명 선택 · 시연용</span><input ref={restoreFile} id="design-document" type="file" onChange={event => { file.value = (event.target as HTMLInputElement).files?.[0] || null }}/><small>파일은 전송하지 않습니다. 선택하지 않으면 예제 문서를 표시합니다.</small></label>}
          <p class="v08-note">프로젝트에 적용된 규정은 자동 포함됩니다. 현재 {includeCriteria.value ? '예제 규정 적용 시연' : '규정 미적용'} 상태이며 규정 미구현 판정과 구분합니다.</p>
          <div class="v08-actions"><Button type="submit" disabled={!canStartDiagnosis(draft.value)}>예제 진단 시작</Button><Button variant="secondary" onClick={reset}>입력 초기화</Button></div>
        </form>
        <aside class="v08-stack">
          <section><SectionBand title="실행에 고정되는 정보"/><div class="v08-well"><RunFacts rows={[
            ['저장소', <code>juice-shop/juice-shop</code>],
            ['코드 버전', draft.value.connection?.revision || '미확인'],
            ['설계 문서', documentName() || '미제공'],
            ['규정', includeCriteria.value ? policyExample.title : '프로젝트 규정 미적용'],
            ['Rule 묶음', '공개 표본 Rule v1 · 시연'],
          ]}/></div></section>
          <div class="v08-notice"><strong>설계 문서 없이 실행 가능</strong><p>설계 검토를 생략하고 코드 기반 시연을 이어갑니다.</p></div>
          <div class="v08-actions"><RouterLink class="v08-link" to="/criteria">적용 기준 보기</RouterLink><Button variant="secondary" onClick={() => start(true)}>코드 접근 실패 예시</Button></div>
        </aside>
      </div>
    </main>
  </>
} })
