import { createApp, h } from 'vue'
import { createRouter, createWebHashHistory, RouterView } from 'vue-router'
import { VueQueryPlugin } from '@tanstack/vue-query'
import App from './App'
import {findings} from './data'
import { clearFindingsOrigin, findingsReturnPosition, isResultPath, rememberFindings, resolveRequestedRun, resultManagementTarget, runQuery } from './navigation'
import { selectedRun, selectRun } from './workflow'
import './styles.css'
import './ledger.css'
import './platform.css'
import './judgments.css'
import './projects.css'
import './reports.css'
import './issues.css'
import './reading.css'
import './dashboard.css'
import './mobile.css'
import './workflow.css'
import './taste-v3.css'
const routes=['/overview','/projects','/security','/code','/measures','/quality-gate','/profiles','/settings','/runs','/new','/progress','/findings','/findings/:id','/code-report/:id','/criteria','/criteria/:id','/rules','/rules/:id/revise','/report','/validation','/preview/:state','/connect','/connect/repositories','/connect/permission'].map(path=>({path,component:App}))
const router=createRouter({history:createWebHashHistory(),routes:[{path:'/',redirect:'/overview'},{path:'/references',redirect:'/validation'},{path:'/results',redirect:to=>resultManagementTarget(to.query)},...routes,{path:'/:pathMatch(.*)*',redirect:'/overview'}],scrollBehavior:(to,from,saved)=>{
  if(saved)return saved
  if(to.path===from.path)return false
  if(to.path==='/findings' && /^\/(findings|code-report)\//.test(from.path))return {top:findingsReturnPosition(to.query).top}
  return {top:0}
}})
router.beforeEach((to,from)=>{
  if(isResultPath(to.path)){
    const requested=resolveRequestedRun(to.query)
    if(requested.unavailable)return {path:'/preview/run-unavailable',query:{requestedRun:String(to.query.run||'')}}
    if(requested.run){
      if(requested.run.step<4||requested.run.codeFailed)return {path:'/progress',query:{run:requested.run.id}}
      selectRun(requested.run)
      if(!to.query.at)return {path:to.path,query:{...to.query,...runQuery(requested.run)},replace:true}
    }else{
      const run=selectedRun()
      if(run)return {path:to.path,query:{...to.query,...runQuery(run)},replace:true}
    }
  }
  if (to.path.startsWith('/findings/') && !findings.some(f=>f.id===String(to.params.id))) return '/preview/missing'
  if (to.path.startsWith('/code-report/')) {
    const finding = findings.find(f=>f.id===String(to.params.id))
    if (!finding) return '/preview/missing'
    if (finding.type === '확인 필요') return {path:`/findings/${encodeURIComponent(finding.id)}`,query:to.query}
  }
  if(from.path==='/findings'&&to.path.startsWith('/findings/'))rememberFindings(from.fullPath,from.query,window.scrollY,String(to.params.id))
  else if(to.path.startsWith('/findings/')&&!/^\/(findings|code-report)(\/|$)/.test(from.path))clearFindingsOrigin()
})
createApp({render:()=>h(RouterView)}).use(router).use(VueQueryPlugin,{queryClientConfig:{defaultOptions:{queries:{retry:false,refetchOnWindowFocus:false}}}}).mount('#app')
