export interface CodebaseConnection {
  mode: 'example' | 'agent'
  rootPath: string
  project: string
  revision: string
  readScope: string
  connectionId: string
}
export const exampleConnection: Readonly<CodebaseConnection> = Object.freeze({
  mode: 'example', rootPath: '/examples/juice-shop', project: 'OWASP Juice Shop',
  revision: 'v19.0.0', readScope: '공개 코드의 로그인·장바구니 경로', connectionId: 'public-example-only',
})
export interface ConnectionDraft { rootPath: string; connection: CodebaseConnection | null }
export function validateRootPath(value: string): string | null {
  if (!value.trim()) return '코드베이스의 루트 경로를 입력해 주세요.'
  if (value.length > 2048 || /[\u0000-\u001f\u007f]/.test(value)) return '경로에 줄바꿈·제어 문자를 넣을 수 없습니다. 2048자 이내로 입력해 주세요.'
  return null
}
export function editConnectionPath(value: string): ConnectionDraft {
  // Editing invalidates the preceding permission check and version pin.
  return { rootPath: value, connection: null }
}
export function exampleDraft(): ConnectionDraft {
  return { rootPath: exampleConnection.rootPath, connection: { ...exampleConnection } }
}
export function canStartDiagnosis(draft: ConnectionDraft): boolean {
  const c = draft.connection
  return !!c && !validateRootPath(draft.rootPath) && draft.rootPath === c.rootPath && !!c.revision && !!c.connectionId
}
export interface AgentFailure { ok: false; code: 'agent_unavailable'; message: string }
export interface AgentGateway {
  connectCodebase(rootPath: string): Promise<{ ok: true; connection: CodebaseConnection } | AgentFailure>
  registerPolicy(file: { name: string; size: number; type: string }): Promise<AgentFailure>
}
// Integration boundary: the browser cannot verify an Agent's filesystem.
// Replace with the agreed API; never infer success from a path string.
export const agentGateway: AgentGateway = {
  async connectCodebase() {
    return { ok: false, code: 'agent_unavailable', message: 'Agent 연결 전입니다. 이 경로의 존재·읽기 권한·버전을 확인하지 않았습니다. 공개 예제로 화면 흐름을 확인할 수 있습니다.' }
  },
  async registerPolicy() {
    return { ok: false, code: 'agent_unavailable', message: '문서 등록과 AI 기준 추출은 Agent 연결 후 사용할 수 있습니다. 선택한 파일은 전송하지 않았습니다.' }
  },
}
