import { reactive } from 'vue'
import { exampleConnection } from './agent'
import { validCriterionIds } from './policies'
interface RunContext { documentName: string; criterionIds: string[] }
export function normalizeRunContext(value: unknown): RunContext {
  const input = value && typeof value === 'object' ? value as Partial<RunContext> : {}
  const name = typeof input.documentName === 'string' ? input.documentName.slice(0, 255).replace(/[\u0000-\u001f\u007f]/g, '') : ''
  return { documentName: name, criterionIds: validCriterionIds(input.criterionIds) }
}
function restore(): RunContext {
  try { return normalizeRunContext(JSON.parse(sessionStorage.getItem('trace-run-context-v1') || 'null')) }
  catch { return normalizeRunContext(null) }
}
export const runContext = reactive(restore())
export const activeConnection = exampleConnection
export function setExampleContext(documentName: string, criterionIds: string[]) {
  Object.assign(runContext, normalizeRunContext({ documentName, criterionIds }))
  try { sessionStorage.setItem('trace-run-context-v1', JSON.stringify(runContext)) } catch { /* Storage may be disabled. */ }
}
