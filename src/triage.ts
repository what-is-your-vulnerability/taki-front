import { reactive } from 'vue'
import { findings } from './data'
export type ReviewStatus = 'unreviewed' | 'in-progress' | 'needs-context' | 'recorded'
export const reviewLabels: Record<ReviewStatus,string> = { unreviewed: '검토 전', 'in-progress': '검토 중', 'needs-context': '자료 요청', recorded: '검토 기록됨' }
export interface ReviewRecord { status: ReviewStatus; note: string }
export function normalizeReviews(value: unknown): Record<string, ReviewRecord> {
  const raw = value && typeof value === 'object' ? value as Record<string,Partial<ReviewRecord>> : {}
  return Object.fromEntries(findings.map(f => { const v = raw[f.id] || {}; const note = typeof v.note === 'string' ? v.note.slice(0,2000) : ''; const status = v.status && Object.hasOwn(reviewLabels,v.status) && (v.status !== 'recorded' || note.trim()) ? v.status : 'unreviewed'; return [f.id,{status,note}] }))
}
function restore() { try { return normalizeReviews(JSON.parse(sessionStorage.getItem('trace-review-notes') || 'null')) } catch { return normalizeReviews(null) } }
export const reviews = reactive(restore())
export function saveReview(id: string, record: ReviewRecord): boolean {
  if (!findings.some(f => f.id === id) || (record.status === 'recorded' && !record.note.trim())) return false
  reviews[id] = normalizeReviews({[id]:record})[id]
  try { sessionStorage.setItem('trace-review-notes',JSON.stringify(reviews)) } catch { /* Session storage is optional. */ }
  return true
}
