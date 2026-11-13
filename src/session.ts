import { reactive } from 'vue'

interface DemoProgress { stage: number; withDocument: boolean; documentFailed: boolean }
const initial: DemoProgress = { stage: 0, withDocument: false, documentFailed: false }
export function normalizeProgress(value: unknown): DemoProgress {
  if (!value || typeof value !== 'object') return { ...initial }
  const state = value as Partial<DemoProgress>
  const stage = Number.isFinite(state.stage) ? Math.max(0, Math.min(5, Math.floor(state.stage!))) : 0
  return { stage, withDocument: state.withDocument === true, documentFailed: state.withDocument === true && state.documentFailed === true }
}
function restore() {
  try { return normalizeProgress(JSON.parse(sessionStorage.getItem('trace-review-r2') || 'null')) } catch { return { ...initial } }
}
export const demo = reactive(restore())
export function saveProgress() {
  try { sessionStorage.setItem('trace-review-r2', JSON.stringify(demo)) } catch { /* The preview also works when browser storage is unavailable. */ }
}
export function startDemo(withDocument: boolean) { Object.assign(demo, { stage: 0, withDocument, documentFailed: false }); saveProgress() }
export function nextDemoStage(stage: number, hasContext: boolean) {
  const next = Math.min(5, stage + 1)
  return next === 2 && !hasContext ? 3 : next
}
export function advanceDemo(hasContext = true) { demo.stage = nextDemoStage(demo.stage, hasContext); saveProgress() }
