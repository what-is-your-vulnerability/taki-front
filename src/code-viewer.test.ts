import { expect, it } from 'vitest'
import { createSSRApp, h } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { CodeViewer } from './screens/CodeViewer'

it('근거의 원문과 전체 위치를 보존하고 코드는 HTML로 실행하지 않는다',async()=>{
  const code='const literal = "<script>alert(1)</script>"\n  return literal'
  const html=await renderToString(createSSRApp({render:()=>h(CodeViewer,{code,label:'코드 근거',file:'src/routes/login.ts:31',version:'v19.0.0'})}))
  expect(html).toContain('login.ts:31')
  expect(html).toContain('src/routes/login.ts:31')
  expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;')
  expect(html).not.toContain('<script>')
  expect(html.match(/<dialog\b[^>]*>/)?.[0]).not.toMatch(/\sopen(?:\s|=|>)/)
  expect(html).toContain('aria-label="코드 근거 코드"')
})

it('원본 발췌 행과 선택된 흐름을 일반 보기와 확대 보기에 동일하게 표시한다',async()=>{
  const lines=[{ number: 16, step: 0, text: 'const id = req.params.id' },{ number: 17, step: 1, text: 'lookup("<value>")', mark: '<value>' }]
  const html=await renderToString(createSSRApp({render:()=>h(CodeViewer,{code:'이전 축약',label:'근거 코드',lines,activeStep:1})}))
  expect(html.match(/evidence-source-line active/g)).toHaveLength(2)
  expect(html).toContain('evidence-line-number">17')
  expect(html).toContain('<mark>&lt;value&gt;</mark>')
  expect(html).not.toContain('이전 축약')
})
