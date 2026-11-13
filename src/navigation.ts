import type { LocationQuery, LocationQueryRaw, RouteLocationRaw } from 'vue-router'
import { runById, selectedRun, type DemoRun } from './workflow'

export function isResultPath(path: string) {
  return ['/overview', '/findings', '/code-report', '/report', '/security', '/code', '/measures', '/results'].some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}

export function runQuery(run: DemoRun): LocationQueryRaw {
  // The creation stamp disambiguates the preview's tab-local RUN counter.
  return { run: run.id, at: run.createdAt }
}

export function withRunTarget(to: RouteLocationRaw): RouteLocationRaw {
  const run = selectedRun()
  if (!run) return to
  if (typeof to !== 'string') {
    if (!('path' in to) || !to.path || !isResultPath(to.path) || to.query?.run !== undefined) return to
    return { ...to, query: { ...to.query, ...runQuery(run) } }
  }
  const [path, search = ''] = to.split('?')
  if (!isResultPath(path)) return to
  const query = new URLSearchParams(search)
  if (!query.has('run')) { query.set('run', run.id); query.set('at', run.createdAt) }
  return `${path}?${query}`
}

export function resultHref(path: string) {
  return `#${withRunTarget(path)}`
}

export function resultManagementTarget(query: LocationQuery): RouteLocationRaw {
  return { path: '/report', query: { ...query, panel: 'management' } }
}

export function resolveRequestedRun(query: LocationQuery): { requested: boolean; run?: DemoRun; unavailable: boolean } {
  if (query.run === undefined) return { requested: false, unavailable: false }
  const id = typeof query.run === 'string' ? query.run : ''
  const run = runById(id)
  const stampMatches = query.at === undefined || typeof query.at === 'string' && query.at === run?.createdAt
  return { requested: true, run: stampMatches ? run : undefined, unavailable: !run || !stampMatches }
}

interface FindingsOrigin { path: string; run: string; at: string; scroll: number; id: string }
let origin: FindingsOrigin | undefined
export function rememberFindings(path: string, query: LocationQuery, scroll: number, id: string) {
  origin = { path, run: String(query.run || ''), at: String(query.at || ''), scroll, id }
}
function sameOrigin(query: LocationQuery) {
  return origin && origin.run === String(query.run || '') && origin.at === String(query.at || '')
}
export function findingsReturnTarget(query: LocationQuery) {
  return sameOrigin(query) ? origin!.path : withRunTarget('/findings')
}
export function findingsReturnPosition(query: LocationQuery) {
  return sameOrigin(query) ? { top: origin!.scroll, id: origin!.id } : { top: 0, id: '' }
}
export function clearFindingsOrigin() { origin = undefined }
