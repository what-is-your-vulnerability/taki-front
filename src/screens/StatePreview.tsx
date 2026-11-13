import {defineComponent} from 'vue'
import {useRoute} from 'vue-router'
import {Header,Notice,Badge,Button,Icon} from '../ui'
import type {Page} from '../data'
const states={
 empty:{title:'발견 0건',tone:'neutral',heading:'현재 범위에서 발견된 항목이 없습니다.',description:'분석 범위와 한계를 확인하세요. 발견 0건은 안전을 보증하지 않습니다.',action:'분석 범위 확인',to:'report'},
 failure:{title:'진단 실패',tone:'danger',heading:'진단을 완료하지 못했습니다.',description:'실패 단계와 입력을 확인하세요. 실패는 발견 0건과 구분합니다.',action:'입력 확인',to:'new'},
 partial:{title:'문서 부분 실패',tone:'warning',heading:'문서 맥락을 반영하지 못했습니다.',description:'코드 결과는 유지됩니다. 문서가 필요한 판정은 확인 필요로 남깁니다.',action:'코드 결과 보기',to:'findings'},
 unsupported:{title:'미지원 입력',tone:'warning',heading:'선택한 입력을 분석할 수 없습니다.',description:'지원 범위를 확인한 뒤 다른 입력으로 진행하세요. 미지원은 안전 판정이 아닙니다.',action:'입력 확인',to:'new'},
 missing:{title:'발견 항목 없음',tone:'neutral',heading:'요청한 발견 항목이 없습니다.',description:'목록에서 확인할 항목을 다시 선택하세요.',action:'발견 목록',to:'findings'},
} as const
export const StatePreview=defineComponent({props:['go'],setup(props){const route=useRoute();return()=>{const state=states[String(route.params.state) as keyof typeof states]||states.missing;return <><Header title={state.title} eyebrow="상태 미리보기" onMenu={()=>{}}/><main tabindex={-1} class="content narrow"><Notice/><section class="panel prose-panel"><Badge tone={state.tone}>상태 예시</Badge><h2>{state.heading}</h2><p>{state.description}</p><Button variant="primary" onClick={()=>props.go(state.to as Page)}>{state.action}<Icon name="arrow" size={15}/></Button></section></main></>}}})
