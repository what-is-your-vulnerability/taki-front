import { defineComponent, onBeforeUnmount, ref, useId, type PropType } from 'vue'
import { SourceLocation } from './SourceLocation'

export interface EvidenceExcerptLine { number?: number; step?: number; text: string; mark?: string }

export const CodeViewer = defineComponent({name:'CodeViewer',props:{
  code:{type:String,required:true},label:{type:String,required:true},file:String,version:String,
  lines: Array as PropType<readonly EvidenceExcerptLine[]>, activeStep: Number,
},setup(props) {
  const dialog = ref<HTMLDialogElement|null>(null), titleId = `code-title-${useId()}`
  const trapTab = (event: KeyboardEvent) => {
    if (event.key!=='Tab'||!dialog.value) return
    const stops=[...dialog.value.querySelectorAll<HTMLElement>('button:not([disabled]),[tabindex="0"]')]
    const first=stops[0], last=stops.at(-1)
    if (event.shiftKey&&document.activeElement===first) {event.preventDefault();last?.focus()}
    else if (!event.shiftKey&&document.activeElement===last) {event.preventDefault();first?.focus()}
  }
  const codeBlock = () => props.lines ? props.lines.map((line, index) => {
    const marked = line.mark ? line.text.indexOf(line.mark) : -1
    return <span key={index} class={['evidence-source-line', { active: line.step !== undefined && line.step === props.activeStep }]}>
      <span class="evidence-line-number">{line.number}</span><span>{marked < 0 ? line.text : <>{line.text.slice(0, marked)}<mark>{line.mark}</mark>{line.text.slice(marked + line.mark!.length)}</>}</span>
    </span>
  }) : props.code
  const codeView = (label: string) => <pre class={['report-code evidence-code-scroll', { 'evidence-source-code': !!props.lines }]} tabindex={0} role="region" aria-label={label}><code>{codeBlock()}</code></pre>
  onBeforeUnmount(()=>dialog.value?.close())
  return ()=><div class="evidence-code-viewer">
    {props.file&&<SourceLocation file={props.file}/>}
    <div class="evidence-code-toolbar"><span>{props.version?`${props.version} · 참고 위치`:props.label}</span><button type="button" aria-label={`${props.label} 확대 보기`} onClick={()=>dialog.value?.showModal()}>확대 보기</button></div>
    {codeView(`${props.label} 코드`)}
    <dialog ref={dialog} class="evidence-code-dialog" aria-labelledby={titleId} onKeydown={trapTab}>
      <div class="evidence-code-dialog-heading"><h2 id={titleId}>{props.label}</h2><button type="button" autofocus onClick={()=>dialog.value?.close()}>닫기</button></div>
      {props.file&&<SourceLocation file={props.file}/>}
      {props.version&&<p class="report-meta">{props.version} · 참고 위치</p>}
      {codeView(`${props.label} 확대 코드`)}
      <p class="report-meta">{props.lines ? '고정 버전의 원본 발췌 · 줄바꿈 및 일부 생략' : '설명용 축약 코드 · 원본 수정 미수행'}</p>
    </dialog>
  </div>
}})
