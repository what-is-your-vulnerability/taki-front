import type { LocationQuery, LocationQueryRaw } from 'vue-router'

export interface FindingFilters { query: string; kind: string; cwe: string; file: string; sort: string }
export const defaultFindingFilters: Readonly<FindingFilters> = { query: '', kind: 'all', cwe: 'all', file: 'all', sort: 'priority' }
const one = (value: unknown) => typeof value === 'string' ? value : ''
export function readFindingFilters(query: LocationQuery, cwes: string[], files: string[]): FindingFilters {
  const kind = one(query.type), cwe = one(query.cwe), file = one(query.file)
  return {
    query: one(query.q).slice(0, 255),
    kind: ['vulnerability','missing','satisfied','review','not-applicable','suspected','unsupported'].includes(kind) ? kind : 'all',
    cwe: cwes.includes(cwe) ? cwe : 'all', file: files.includes(file) ? file : 'all',
    sort: query.sort === 'id' ? 'id' : 'priority',
  }
}
export function writeFindingFilters(query: LocationQuery, filters: FindingFilters): LocationQueryRaw {
  const result: LocationQueryRaw = { ...query }
  for (const key of ['q','type','cwe','file','sort']) delete result[key]
  if (filters.query) result.q = filters.query
  if (filters.kind !== 'all') result.type = filters.kind
  if (filters.cwe !== 'all') result.cwe = filters.cwe
  if (filters.file !== 'all') result.file = filters.file
  if (filters.sort !== 'priority') result.sort = filters.sort
  return result
}
const expanded = new Map<string, boolean>()
export const filterScope = (query: LocationQuery) => `${query.run || 'sample'}:${query.at || ''}`
export const filtersExpanded = (query: LocationQuery) => expanded.get(filterScope(query)) || false
export function rememberFilterExpanded(query: LocationQuery, open: boolean) { expanded.set(filterScope(query), open) }
