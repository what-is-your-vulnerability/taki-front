import { defineComponent, ref, useId, watch } from 'vue'
import { copySourceLocation, shortSourceLocation } from '../source-location'

export const SourceLocation = defineComponent({name:'SourceLocation',props:{file:{type:String,required:true}},setup(props) {
  const expanded = ref(false), result = ref<'idle'|'copied'|'failed'>('idle'), pathId = `source-path-${useId()}`
  watch(()=>props.file,()=>{expanded.value=false;result.value='idle'})
  const copy = async () => {
    const captured = props.file
    result.value='idle'
    const copied = await copySourceLocation(captured,navigator.clipboard)
    if (captured !== props.file) return
    result.value=copied?'copied':'failed'
    if (!copied) expanded.value=true
  }
  return ()=><div class="source-location">
    <div class="source-location-line"><span>{shortSourceLocation(props.file)}</span>
      <button type="button" aria-expanded={expanded.value} aria-controls={pathId} onClick={()=>expanded.value=!expanded.value}>{expanded.value?'경로 접기':'전체 경로'}</button>
      <button type="button" aria-label={`${shortSourceLocation(props.file)} 전체 경로 복사`} onClick={copy}>복사</button>
      <span class="source-copy-status" role="status">{result.value==='copied'?'복사됨':''}</span>
    </div>
    <p id={pathId} class="source-location-full" hidden={!expanded.value}>{props.file}</p>
    {result.value==='failed'&&<p class="source-copy-error" role="alert">복사하지 못했습니다. 전체 경로를 선택해 복사해 주세요.</p>}
  </div>
}})
