import { defineComponent, ref } from 'vue'
import { findings } from '../data'
import { summarize } from '../domain'
import { evidenceFiles } from '../quality'
import { Header, Icon } from '../ui'
import { activeConnection } from '../run-context'
import { publicJudgmentSample } from '../judgments'
import { securityGrade } from '../security-grade'
export const Measures=defineComponent({name:'Measures',setup(){const category=ref('보안');return()=>{const count=summarize(findings);const metrics:Record<string,{label:string,value:string,context:string,link?:string}[]>={
 '보안':[{label:'취약 사례',value:`${count.vulnerabilities}개`,context:'공개 코드 수동 검토 표본',link:'#/findings?type=vulnerability'},{label:'정책 확인 필요',value:`${count.review}개`,context:'취약점 합계 제외',link:'#/security'},{label:'보안 등급',value:securityGrade(activeConnection.mode==='example'?publicJudgmentSample:null,findings)??'미측정',context:activeConnection.mode==='example'?'수동 검토 표본 · 전체 코드 등급 아님':'엔진 분석 결과 연결 전'}],
 '신뢰성':[{label:'신뢰성 이슈',value:'미측정',context:'신뢰성 분석 연결 전'},{label:'신뢰성 등급',value:'미측정',context:'측정 근거 없음'}],
 '유지보수성':[{label:'유지보수성 이슈',value:'미측정',context:'보안 진단 범위와 별도'},{label:'기술 부채',value:'미측정',context:'산정 근거 없음'}],
 '테스트·규모':[{label:'테스트 커버리지',value:'미측정',context:'테스트 리포트 연결 전'},{label:'중복률',value:'미측정',context:'중복 분석 연결 전'},{label:'근거 파일',value:`${evidenceFiles.length}개`,context:'전체 저장소 파일 수 아님',link:'#/code'},{label:'전체 코드 줄 수',value:'미측정',context:'전체 저장소 분석 전'}]}
return <><Header title="측정값"/><main id="main-content" tabindex={-1} class="content"><div class="measure-layout"><nav class="measure-categories" aria-label="측정 항목">{Object.keys(metrics).map(name=><button key={name} aria-pressed={category.value===name} onClick={()=>category.value=name}>{name}<Icon name="chevron" size={15}/></button>)}</nav><section class="measure-values"><div class="widget-heading"><div><h2>{category.value}</h2><p>고정 버전 v19.0.0 · 검토 표본</p></div><a href="#/quality-gate">판정 조건 <Icon name="arrow" size={14}/></a></div><div class="measure-column-head"><span>지표</span><span>측정값</span><span>근거</span></div>{metrics[category.value].map(metric=><div class="measure-row" key={metric.label}><strong>{metric.label}</strong><span class={{'unmeasured':metric.value==='미측정'}}>{metric.value}</span><p>{metric.context}</p>{metric.link&&<a href={metric.link} aria-label={metric.label+' 근거 보기'}><Icon name="arrow" size={17}/></a>}</div>)}<div class="measure-note"><Icon name="info" size={17}/><p>미측정 값은 0이나 안전 등급으로 환산하지 않습니다.</p></div></section></div></main></>}
}})
