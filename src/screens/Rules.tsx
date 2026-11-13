import {defineComponent, ref} from 'vue'
import {useRoute, useRouter} from 'vue-router'
import { RouterLink } from 'vue-router'
import { ruleCasesTarget, ruleContext, ruleQuery } from '../rule-context'
import { ruleCatalog } from '../quality'
import { latestRuleRevision, validationLabels } from '../workflow'
import { RunFacts, SectionBand } from '../components/WorkflowLayout'

import {Icon, Badge, Header} from '../ui'

const RuleCases=defineComponent({name:"Rules",props:[],setup(__props,{slots}){
const route = useRoute(), router = useRouter();
const selected=ref(0); const setSelected=(value:typeof selected.value)=>{selected.value=value};
return()=>{

  const { criterion, rule, version } = ruleContext(route.query)
  const ownership = rule.id === 'TRACE-ACCESS-01'
  const cases = ownership ? [
    ["정상 사례", "사용자와 장바구니 소유 관계 확인", "기대: 정상", "미실행"],
    ["취약 사례", "객체 ID만으로 장바구니 조회", "기대: 취약", "미실행"],
    ["대체 정상", "조회 조건에 인증 사용자 포함", "기대: 정상", "미실행"],
  ] : [
    ["정상 사례", "파라미터 바인딩 사용", "기대: 정상", "미실행"],
    ["취약 사례", "사용자 입력 문자열 결합", "기대: 취약", "미실행"],
    ["대체 정상", "ORM 조건 객체 사용", "기대: 정상", "미실행"],
  ]
  return (
    <>
      <Header title="Rule 검증 사례" eyebrow="사례 3개 · 미실행" actions={<RouterLink class="v08-link" to={{path:'/rules',query:ruleQuery(rule.id,version,criterion?.id)}}>Rule 목록</RouterLink>} onMenu={() => {}} />
      <main tabindex={-1} class="content">
        <div class="context-bar">
          <div>
            <strong>{rule.name} · {rule.id} v{version}</strong>
            <span>공개 표본 참고 사례 · 선택한 버전의 실제 검증 결과 아님</span>
          </div>
          <Badge tone="neutral">엔진 연결 전</Badge>
        </div>
        <label class="rule-select">점검 규칙<select aria-label="점검 규칙" value={ownership ? 'ownership' : 'sql'} onChange={(event: Event) => { selected.value = 0; router.push((event.target as HTMLSelectElement).value === 'ownership' ? ruleCasesTarget('TRACE-ACCESS-01',1,'CR-001') : ruleCasesTarget('TRACE-SQL-01',1)) }}><option value="sql">SQL 입력 결합 · CWE-89</option><option value="ownership">객체 소유권 · CWE-639</option></select></label>
        {criterion && <p class="field-help">연결 기준: <a href={`#/criteria/${criterion.id}`}>{criterion.id} · {criterion.title}</a> · {criterion.state} · 실제 규칙 생성·실행 전{criterion.state === '확인 필요' && ' · 관리자 예외는 정책 확인 전 판정할 수 없습니다.'}</p>}
        <div class="rule-stage">
          <div class="active">
            <span>1</span>
            <strong>초안</strong>
            <small>탐지 조건 정의</small>
          </div>
          <Icon name="arrow" />
          <div class="active">
            <span>2</span>
            <strong>사례 검증</strong>
            <small>기대값 정의 · 미실행</small>
          </div>
          <Icon name="arrow" />
          <div>
            <span>3</span>
            <strong>대상 실행</strong>
            <small>미실행</small>
          </div>
        </div>
        <div class="rules-layout">
          <section class="panel rule-list">
            <div class="panel-head">
              <div>
                <h2>검증 사례</h2>
                <p>3개 사례</p>
              </div>
            </div>
            {cases.map((c, i) => (
              <button
                class={selected.value === i ? "selected" : ""}
                onClick={() => setSelected(i)}
                key={c[0]}
              >
                <span class="case-status pending-case">
                  <Icon name="clock" size={15} />
                </span>
                <div>
                  <strong>{c[0]}</strong>
                  <small>{c[1]}</small>
                </div>
                <Badge tone="neutral">{c[3]}</Badge>
              </button>
            ))}
          </section>
          <section class="panel case-detail">
            <div class="panel-head">
              <div>
                <h2>{cases[selected.value][0]} 검증</h2>
              </div>
              <Badge tone="neutral">미실행 · 엔진 연결 전</Badge>
            </div>
            <div class="expect-row">
              <div>
                <span>기대 판정</span>
                <strong>{cases[selected.value][2].replace("기대: ", "")}</strong>
              </div>
              <Icon name="arrow" />
              <div>
                <span>실제 판정</span>
                <strong>미실행</strong>
                <small>엔진 연결 전</small>
              </div>
            </div>
            <div class="code-block">
              <div class="code-head">
                <span>검증 입력</span>
                <Badge>실행 대기</Badge>
              </div>
              <pre>
                {ownership ? [
                  'findBasket({ id: basketId, userId: authenticatedUser.id })',
                  'findBasket({ id: basketId })',
                  'authorizedBasketQuery(authenticatedUser, basketId)',
                ][selected.value] : selected.value === 0
                  ? `db.query('SELECT * FROM users WHERE id = ?', [userId])`
                  : selected.value === 1
                    ? "db.query(`SELECT * FROM users WHERE id = ${userId}`)"
                    : `User.findOne({ where: { id: userId } })`}
              </pre>
            </div>
            <div class="manual-note">
              <Icon name="clock" />
              <div>
                <strong>아직 실행되지 않았습니다.</strong>
                <span>
                  실행 엔진 연결 전이므로 실제 판정과 검증 결과를 표시하지
                  않습니다.
                </span>
              </div>
            </div>
          </section>
        </div>
      </main>
    </>
  )

}
}});

export const Rules = defineComponent({ name: 'Rules', setup() {
  const route = useRoute()
  return () => {
    if (route.query.tab === 'cases') return <RuleCases/>
    const {criterion,rule:contextRule,version} = ruleContext(route.query)
    const target = contextRule.id
    return <>
      <Header title="Rule 목록" eyebrow="버전의 검증 상태와 실행 여부를 확인합니다."/>
      <main id="main-content" tabindex={-1} class="content v08-flow">
        <div class="v08-grid">
          <div class="v08-stack">
            <section><SectionBand title="실행 Rule"/><div class="v08-rows">
              {ruleCatalog.map(rule => {
                const draft = latestRuleRevision(rule.id)
                return <RouterLink key={rule.id} class="v08-row" to={{path:`/rules/${rule.id}/revise`,query:ruleQuery(rule.id,latestRuleRevision(rule.id)?.version||1,rule.id===contextRule.id?criterion?.id:undefined)}}>
                  <span><strong>{rule.name}</strong><small>{rule.id} · {rule.cwe} · 기준 v1</small>{draft && <small>보완 v{draft.version} · {validationLabels[draft.state]} · 시연</small>}</span>
                  <Badge tone={draft?.state === 'failed' ? 'danger' : draft?.state === 'pending' ? 'warning' : 'neutral'}>{draft ? `v${draft.version} · 미적용` : '실제 검증 미실행'}</Badge><Icon name="chevron" size={16}/>
                </RouterLink>
              })}
            </div></section>
            <div class="v08-actions"><span class="v08-note">{target} v{version}</span><RouterLink class="v08-link" to={ruleCasesTarget(target,version,criterion?.id)}>검증 사례 보기</RouterLink></div>
          </div>
          <aside class="v08-stack">
            <section><SectionBand title="버전 검증"/><div class="v08-well"><RunFacts rows={[
              ['고정 기준', '공개 표본 Rule v1'], ['검증 범위', '구문·정상/취약 사례·실행 가능성'],
              ['실제 검증 / 실행', '엔진 연결 전'],
              ['사용 조건', '검증을 통과한 버전만 적용 가능'],
              ['연결 기준', criterion ? <RouterLink to={`/criteria/${criterion.id}`}>{criterion.id} · {criterion.title}</RouterLink> : '기본 기준'],
            ]}/></div></section>
            <div class="v08-notice"><strong>새 버전으로 보완</strong><p>보완본의 검증은 기존 실행 기록과 분리합니다.</p></div>
            <RouterLink class="v08-link v08-primary" to={{path:`/rules/${target}/revise`,query:ruleQuery(target,version,criterion?.id)}}>Rule 보완 요청</RouterLink>
          </aside>
        </div>
      </main>
    </>
  }
} })
