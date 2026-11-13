import { describe, expect, it } from 'vitest'
import { agentGateway, canStartDiagnosis, editConnectionPath, exampleDraft, validateRootPath } from './agent'
import { normalizeRunContext } from './run-context'
describe('코드베이스 연결과 결과 출처의 경계', () => {
  it('경로 문자열만으로 연결·권한 확인을 통과시키지 않는다', async () => {
    const draft = editConnectionPath('/workspace/customer-project')
    expect(canStartDiagnosis(draft)).toBe(false)
    expect(await agentGateway.connectCodebase(draft.rootPath)).toMatchObject({ ok: false, code: 'agent_unavailable' })
    expect(canStartDiagnosis(draft)).toBe(false)
  })
  it('예제 선택 후 경로 편집은 버전 고정과 시작 자격을 해제한다', () => {
    expect(canStartDiagnosis(exampleDraft())).toBe(true)
    expect(canStartDiagnosis(editConnectionPath('/examples/juice-shop'))).toBe(false)
    expect(canStartDiagnosis({ ...exampleDraft(), rootPath: '/different-project' })).toBe(false)
  })
  it('공백이 있는 경로를 유지하고 빈 값·제어 문자는 거부한다', () => {
    expect(validateRootPath('/workspace/고객 서비스')).toBeNull()
    expect(validateRootPath('C:\\Projects\\service')).toBeNull()
    expect(validateRootPath('   ')).not.toBeNull()
    expect(validateRootPath('/app\n/other')).not.toBeNull()
  })
  it('규정 파일을 전송·추출 완료로 가장하지 않는다', async () => {
    expect(await agentGateway.registerPolicy({ name: '규정.pdf', size: 100, type: 'application/pdf' })).toMatchObject({ ok: false, code: 'agent_unavailable' })
  })
  it('복원된 임의 경로와 알 수 없는 기준을 결과 출처로 쓰지 않는다', () => {
    expect(normalizeRunContext({ rootPath: '/customer/private', revision: 'forged', documentName: '설계\n문서.pdf', criterionIds: ['CR-001', 'unknown', 'CR-001', 42] }))
      .toEqual({ documentName: '설계문서.pdf', criterionIds: ['CR-001'] })
  })
})
