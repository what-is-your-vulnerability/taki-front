export type FindingStatus = 'vulnerability' | 'review'
export type ViewState = 'ready' | 'empty' | 'error' | 'unsupported'
export interface Finding {
  id: string; title: string; category: string; cwe: string; severity: '높음' | '중간' | '확인 필요'; status: FindingStatus
  file: string; line: number; summary: string; reason: string; improvement: string; context: string
  code: { n: number; text: string; focus?: boolean }[]; sourceUrl: string; standardUrl: string; trace: string[]
}
export interface DraftRun { id: string; name: string; code: string; version: string; document: string; withDocument: boolean; stage: number }
