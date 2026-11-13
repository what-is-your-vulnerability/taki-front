export interface Criterion {
  id: string; title: string; state: '적용 예제' | '확인 필요'; original: string
  condition: string; exception: string; scope: string; limitation: string; findingId: string; rule: string
}
export const policyExample = {
  id: 'POL-EXAMPLE', title: '장바구니 접근 기준', version: '예제 v1',
  source: '화면 검토를 위해 작성한 예제 · 실제 사내 규정 아님',
  original: '사용자는 자신에게 속한 장바구니만 조회할 수 있다. 관리자 예외가 있다면 대상 범위와 승인 조건을 업무 정책에서 확인한다.',
}
export const criteria: Criterion[] = [
  { id: 'CR-001', title: '사용자와 장바구니의 소유 관계 확인', state: '적용 예제',
    original: '사용자는 자신에게 속한 장바구니만 조회할 수 있다.',
    condition: '요청한 장바구니 ID와 인증된 사용자 ID의 소유 관계를 검증한다.',
    exception: '허용된 예외 여부는 별도의 업무 정책을 확인한다.', scope: '장바구니 조회 경로 · routes/basket.ts',
    limitation: '코드·규칙을 실제 실행한 결과가 아닌 원문과 근거 연결 예제입니다.',
    findingId: 'TRC-002', rule: '객체 소유권 점검 · 규칙 생성·검증 미실행' },
  { id: 'CR-002', title: '관리자 예외의 범위와 조건 확인', state: '확인 필요',
    original: '관리자 예외가 있다면 대상 범위와 승인 조건을 업무 정책에서 확인한다.',
    condition: '관리자가 타 사용자의 장바구니에 접근할 수 있는지 정책과 코드를 대조한다.',
    exception: '구체적인 예외·승인 조건이 제공되지 않아 허용 여부를 확정하지 않는다.', scope: '관리자 역할의 장바구니 접근',
    limitation: '업무 정책의 실제 조항이 없으므로 충족·위반을 확정하지 않습니다.',
    findingId: 'TRC-003', rule: '정책 확인 질문 · 자동 검증 미지원 예제' },
]
export const getCriterion = (id: string) => criteria.find(item => item.id === id)
export function validCriterionIds(value: unknown): string[] {
  return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && !!getCriterion(id)))] : []
}
