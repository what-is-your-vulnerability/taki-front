import { computed, defineComponent, nextTick, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { findings, type Page } from './data'
import { activeConnection } from './run-context'
import { Icon, type IconName } from './ui'
import { serviceName, serviceLogo } from './brand'
import { Tasks } from './screens/Tasks'
import { NewScan } from './screens/NewScan'
import { Progress } from './screens/Progress'
import { Findings } from './screens/Findings'
import { Detail } from './screens/Detail'
import { CodeReport } from './screens/CodeReport'
import { Rules } from './screens/Rules'
import { RuleRevision } from './screens/RuleRevision'
import { selectedRun } from './workflow'
import { Report } from './screens/Report'
import { Evaluation } from './screens/Evaluation'
import { StatePreview } from './screens/StatePreview'
import { Criteria } from './screens/Criteria'
import { CriterionDetail } from './screens/CriterionDetail'
import { Overview } from './screens/Overview'
import { Projects } from './screens/Projects'
import { CodeExplorer } from './screens/CodeExplorer'
import { SecurityReview } from './screens/SecurityReview'
import { Measures } from './screens/Measures'
import { QualityGate } from './screens/QualityGate'
import { Profiles } from './screens/Profiles'
import { ProjectSettings } from './screens/ProjectSettings'
import { ProjectConnection } from './screens/ProjectConnection'
import { RunUnavailable } from './screens/RunUnavailable'
import { findingsReturnPosition, findingsReturnTarget, resultHref, withRunTarget } from './navigation'
const pagePaths:Partial<Record<Page,string>>={connect:'/connect',results:'/results',overview:'/overview',projects:'/projects',security:'/security',code:'/code',measures:'/measures',gate:'/quality-gate',profiles:'/profiles',settings:'/settings',tasks:'/runs',new:'/new',progress:'/progress',findings:'/findings',criteria:'/criteria',rules:'/rules',report:'/report',evaluation:'/validation',empty:'/preview/empty',failure:'/preview/failure',partial:'/preview/partial',unsupported:'/preview/unsupported'}
const globalNav:{id:Page,label:string,icon:IconName}[]=[{id:'projects',label:'프로젝트',icon:'grid'},{id:'overview',label:'보안 분석',icon:'scan'},{id:'criteria',label:'규칙과 기준',icon:'book'},{id:'evaluation',label:'비교 평가',icon:'chart'}]
const analysisNav:{id:Page,label:string}[]=[{id:'overview',label:'개요'},{id:'findings',label:'판정 목록'},{id:'security',label:'설계 검토'},{id:'report',label:'리포트'},{id:'tasks',label:'분석 기록'},{id:'code',label:'코드'},{id:'measures',label:'측정값'},{id:'settings',label:'설정'}]
const standardsNav:{id:Page,label:string}[]=[{id:'criteria',label:'규정 기준'},{id:'profiles',label:'규칙 프로필'},{id:'rules',label:'Rule'},{id:'gate',label:'Quality Gate'}]
function pageFromPath(path:string):Page{if(path.startsWith('/connect'))return 'connect';if(path.startsWith('/preview/'))return 'preview';if(path.startsWith('/findings/'))return 'detail';if(path.startsWith('/code-report/'))return 'codeReport';if(path.startsWith('/rules/')&&path.endsWith('/revise'))return 'ruleRevision';if(path.startsWith('/criteria/'))return 'criterion';return (Object.keys(pagePaths) as Page[]).find(key=>pagePaths[key]===path)||'overview'}
export const App=defineComponent({name:'App',setup(){
 const route=useRoute(),router=useRouter(),menu=ref(false),page=computed(()=>pageFromPath(route.path))
 const standards=computed(()=>['criteria','criterion','rules','ruleRevision','profiles','gate'].includes(page.value))
 function revealActiveTab(){
  const nav=document.querySelector<HTMLElement>('.project-tabs'),active=nav?.querySelector<HTMLElement>('[aria-current="page"]')
  if(!nav||!active||nav.scrollWidth<=nav.clientWidth)return
  const frame=nav.getBoundingClientRect(),item=active.getBoundingClientRect()
  if(item.left<frame.left+20)nav.scrollLeft-=frame.left+20-item.left
  else if(item.right>frame.right-20)nav.scrollLeft+=item.right-frame.right+20
 }
 onMounted(async()=>{revealActiveTab();await document.fonts.ready;revealActiveTab()})
 async function focusHeading(){await nextTick();revealActiveTab();const id=route.path==='/findings'?findingsReturnPosition(route.query).id:'';const target=id?document.getElementById(`finding-${id}`):null;(target||document.querySelector<HTMLElement>('.topbar h1'))?.focus({preventScroll:true})}
 async function closeMenu(restore=false){menu.value=false;if(restore){await nextTick();document.getElementById('navigation-toggle')?.focus()}}
 async function toggleMenu(){if(menu.value){closeMenu(true);return}menu.value=true;await nextTick();document.querySelector<HTMLElement>('.sidebar nav button[aria-current="page"]')?.focus()}
 watch(()=>route.path,()=>{menu.value=false;focusHeading()})
 const go=async(target:Page)=>{menu.value=false;await router.push(target==='findings'&&['detail','codeReport'].includes(page.value)?findingsReturnTarget(route.query):withRunTarget(pagePaths[target]||'/overview'));await focusHeading()}
 const selectFinding=(id:string)=>router.push(withRunTarget('/findings/'+encodeURIComponent(id)))
 const selectCriterion=(id:string)=>router.push('/criteria/'+encodeURIComponent(id))
 return()=>{
 const activeGlobal=['projects','connect'].includes(page.value)?'projects':page.value==='evaluation'?'evaluation':standards.value?'criteria':'overview'
 const localPage=['new','progress'].includes(page.value)?'tasks':page.value==='results'?'report':page.value==='detail'?'findings':page.value==='codeReport'?'findings':page.value==='criterion'?'criteria':page.value==='ruleRevision'?'rules':page.value
 const localNav=standards.value?standardsNav:['projects','connect','evaluation'].includes(page.value)?[]:analysisNav
 const unavailable=route.path==='/preview/run-unavailable'
 const reportRun=unavailable?undefined:selectedRun()
 const finding=findings.find(item=>item.id===String(route.params.id))
 const content=unavailable?<RunUnavailable/>:page.value==='connect'?<ProjectConnection/>:page.value==='overview'?<Overview go={go}/>:page.value==='projects'?<Projects go={go}/>:page.value==='security'?<SecurityReview selectFinding={selectFinding}/>:page.value==='code'?<CodeExplorer selectFinding={selectFinding}/>:page.value==='measures'?<Measures/>:page.value==='gate'?<QualityGate/>:page.value==='profiles'?<Profiles/>:page.value==='settings'?<ProjectSettings go={go}/>:page.value==='tasks'?<Tasks/>:page.value==='new'?<NewScan/>:page.value==='progress'?<Progress/>:page.value==='findings'?<Findings selectFinding={selectFinding}/>:page.value==='detail'&&finding?<Detail go={go} finding={finding}/>:page.value==='codeReport'&&finding?<CodeReport id={finding.id}/>:page.value==='criteria'?<Criteria selectCriterion={selectCriterion}/>:page.value==='criterion'?<CriterionDetail/>:page.value==='rules'?<Rules/>:page.value==='ruleRevision'?<RuleRevision key={route.path} id={String(route.params.id)}/>:page.value==='report'?<Report openManagement={route.query.panel==='management'}/>:page.value==='evaluation'?<Evaluation/>:<StatePreview go={go}/>
 const v08=['connect','results','overview','findings','detail','codeReport','report','new','progress','tasks','criteria','criterion','rules','ruleRevision','security'].includes(page.value)
 return <div class={['app-shell','trace-platform','taste-v3',v08&&'v08-shell']} onKeydown={(event:KeyboardEvent)=>{if(event.key==='Escape'&&menu.value)closeMenu(true)}}><a class="skip-link" href="#main-content" onClick={(e:Event)=>{e.preventDefault();document.querySelector<HTMLElement>('main')?.focus()}}>본문으로 건너뛰기</a>
 <aside id="main-navigation" class={['sidebar',{open:menu.value}]} aria-label="주 탐색"><div class="brand"><img class="service-logo" src={serviceLogo} alt={serviceName} width={166} height={32}/></div><div class="sidebar-project"><strong>{activeConnection.project}</strong><span>{activeConnection.revision} · 공개 표본</span></div><nav aria-label="주 메뉴">{globalNav.map(item=><button type="button" key={item.id} class={{active:activeGlobal===item.id}} aria-current={activeGlobal===item.id?'page':undefined} disabled={item.id==='evaluation'} onClick={()=>go(item.id)}><Icon name={item.icon}/><span>{item.label}{item.id==='evaluation'&&' · 준비 중'}</span></button>)}</nav><span class="runtime-stamp">검토용 시안<br/>진단 엔진 미연결</span></aside>
 {menu.value&&<button class="scrim" aria-label="메뉴 배경 닫기" onClick={()=>closeMenu(true)}/>}
 <section class="app-main"><div class="mobile-top"><button id="navigation-toggle" type="button" onClick={toggleMenu} aria-label={menu.value?'메뉴 닫기':'메뉴 열기'} aria-expanded={menu.value} aria-controls="main-navigation"><Icon name={menu.value?'close':'menu'}/></button><img class="service-logo" src={serviceLogo} alt={serviceName} width={166} height={32}/><span>웹 보안</span></div>
 {!['projects','connect'].includes(page.value)&&<div class="project-context"><div><a href="#/projects" aria-label="프로젝트 목록"><Icon name="grid" size={15}/></a><Icon name="chevron" size={14}/><a href={resultHref('/overview')}><strong>{activeConnection.project}</strong></a><span class="revision-label">{activeConnection.revision}</span>{reportRun&& !['tasks','new','progress'].includes(page.value)&&<span class="revision-label">{reportRun.id}</span>}</div><span class="connection-stamp"><i/>공개 예제 · 분석 엔진 미연결</span></div>}
 {localNav.length>0&&<nav class="project-tabs" aria-label={standards.value?'기준 관리 메뉴':'프로젝트 메뉴'}>{localNav.filter(item=>standards.value||['overview','findings','report'].includes(item.id)).map(item=><button key={item.id} aria-current={localPage===item.id?'page':undefined} onClick={()=>go(item.id)}>{item.label}</button>)}{!standards.value&&<details class="project-tools"><summary>더보기</summary><div>{analysisNav.filter(item=>!['overview','findings','report'].includes(item.id)).map(item=><button key={item.id} aria-current={localPage===item.id?'page':undefined} onClick={(event)=>{(event.currentTarget as HTMLElement).closest('details')!.open=false;go(item.id)}}>{item.label}</button>)}</div></details>}</nav>}
 {content}</section></div>
 }
}})
export default App
