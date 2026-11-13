import { reactive } from 'vue'
import { editConnectionPath } from './agent'
import type { DesignState, ValidationState } from './workflow'

// Only tab memory: no source documents or unfinished corrections are persisted.
const freshScan = () => ({ connection: editConnectionPath(''), design: 'omitted' as DesignState, file: null as File | null, includeCriteria: false })
export const scanDraft = reactive(freshScan())
export function resetScanDraft() { Object.assign(scanDraft, freshScan()) }

interface RuleDraft { correction: string; reason: string; scenario: ValidationState }
const rules = new Map<string, RuleDraft>()
export function ruleDraft(id: string) {
  let draft = rules.get(id)
  if (!draft) { draft = reactive<RuleDraft>({ correction: '', reason: '', scenario: 'pending' }); rules.set(id, draft) }
  return draft
}
export function resetRuleDraft(id: string) { Object.assign(ruleDraft(id), { correction: '', reason: '', scenario: 'pending' }) }
