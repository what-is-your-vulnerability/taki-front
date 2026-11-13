export type Page = "overview" | "projects" | "security" | "code" | "measures" | "gate" | "profiles" | "settings" | "criteria" | "criterion" | "preview" | "empty" | "failure" | "partial" | "unsupported" | "tasks" | "new" | "progress" | "findings" | "detail" | "codeReport" | "rules" | "ruleRevision" | "report" | "evaluation" | "connect" | "results"
export type Finding = {
  id: string
  title: string
  cwe: string
  level: string
  file: string
  type: "취약 사례" | "확인 필요"
  color: "danger" | "warning"
  summary: string
  code: string
  lineLabel: string
  evidenceTitle: string
  evidenceDescription: string
  flow: { title: string; detail: string }[]
  controls: { status: "pass" | "fail" | "info"; title: string; detail: string }[]
  input: string
  sink: string
  impact: string
  reasonTitle: string
  reason: string
  reasons: { title: string; detail: string }[]
  improvementTitle: string
  improvement: string
  improvementCode?: string
  checks: { title: string; detail: string }[]
  sourceUrl: string
  cweUrl: string
}
export const findings: Finding[] = [
  {
    id: "TRC-001",
    title: "로그인 쿼리에 사용자 입력 직접 결합",
    cwe: "CWE-89",
    level: "높음",
    file: "routes/login.ts:31",
    type: "취약 사례",
    color: "danger",
    summary: "외부 입력이 파라미터 바인딩 없이 SQL 쿼리 문자열에 포함됩니다.",
    code: "29  const email = req.body.email\n30  const query = `SELECT * FROM Users\n31    WHERE email = '${email}'`\n32  models.sequelize.query(query).then(...)",
    lineLabel: "29–33행",
    evidenceTitle: "사용자 입력이 쿼리 구조에 영향을 줄 수 있습니다.",
    evidenceDescription:
      "req.body.email 값이 파라미터 바인딩 없이 문자열 템플릿에 삽입됩니다.",
    flow: [
      { title: "HTTP 요청", detail: "POST /login" },
      { title: "입력 추출", detail: "req.body.email" },
      { title: "SQL 실행", detail: "sequelize.query" },
    ],
    controls: [
      {
        status: "fail",
        title: "파라미터 바인딩",
        detail: "해당 호출 경로에서 확인되지 않음",
      },
      {
        status: "pass",
        title: "인증 흐름",
        detail: "로그인 전 엔드포인트로 인증 통제 대상 아님",
      },
      {
        status: "info",
        title: "입력 검증",
        detail: "형식 검사는 SQL 구조 보호를 대체하지 않음",
      },
    ],
    input: "req.body.email",
    sink: "sequelize.query",
    impact: "인증 우회 가능성",
    reasonTitle: "왜 취약 사례로 판정했나요?",
    reason:
      "요청 본문의 email 값이 SQL 문자열의 조건절에 직접 삽입되고, 해당 문자열이 쿼리 실행 함수로 전달됩니다. 호출 경로에서 구조적 파라미터 바인딩은 확인되지 않았습니다.",
    reasons: [
      { title: "외부 제어 입력", detail: "HTTP 요청 본문에서 값을 읽습니다." },
      { title: "문자열 결합", detail: "입력이 쿼리 템플릿에 직접 포함됩니다." },
      {
        title: "실행 지점 도달",
        detail: "구성된 문자열이 SQL 실행 함수로 전달됩니다.",
      },
    ],
    improvementTitle: "파라미터 바인딩으로 쿼리 구조를 분리하세요",
    improvement: "입력값을 SQL 구문과 분리하여 데이터로만 처리해야 합니다.",
    improvementCode:
      "const query = 'SELECT * FROM Users WHERE email = :email'\nsequelize.query(query, {\n  replacements: { email: req.body.email }\n})",
    checks: [
      {
        title: "사용 중인 Sequelize 버전과 설정",
        detail: "바인딩 옵션의 실제 동작을 확인하세요.",
      },
      {
        title: "동일 패턴의 다른 로그인 경로",
        detail: "관리자·소셜 로그인 경로도 별도로 검토하세요.",
      },
      {
        title: "배포 버전 일치 여부",
        detail: "검토한 v19.0.0 코드와 운영 배포본의 일치를 확인하세요.",
      },
    ],
    sourceUrl:
      "https://github.com/juice-shop/juice-shop/blob/v19.0.0/routes/login.ts#L29-L33",
    cweUrl: "https://cwe.mitre.org/data/definitions/89.html",
  },
  {
    id: "TRC-002",
    title: "장바구니 객체 소유권 통제 검토",
    cwe: "CWE-639",
    level: "높음",
    file: "routes/basket.ts:17",
    type: "취약 사례",
    color: "danger",
    summary:
      "요청한 장바구니 식별자와 현재 사용자의 소유 관계를 별도로 검증해야 합니다.",
    code: "14  router.get('/rest/basket/:id', ...)\n17  const basketId = req.params.id\n20  Basket.findOne({ where: { id: basketId } })\n24  return basket",
    lineLabel: "14–29행",
    evidenceTitle: "인증과 객체 단위 인가는 별개의 통제입니다.",
    evidenceDescription:
      "인증된 요청이어도 basketId가 현재 사용자 소유인지 확인하는 경로가 필요합니다.",
    flow: [
      { title: "인증된 요청", detail: "GET /basket/:id" },
      { title: "객체 식별자", detail: "req.params.id" },
      { title: "장바구니 조회", detail: "Basket.findOne" },
    ],
    controls: [
      {
        status: "pass",
        title: "사용자 인증",
        detail: "요청 사용자 식별과 객체 소유권 검증은 구분",
      },
      {
        status: "fail",
        title: "객체 소유권 조건",
        detail: "조회 조건에서 사용자와의 관계 확인 필요",
      },
      {
        status: "info",
        title: "공통 인가 통제",
        detail: "미들웨어 또는 모델 계층의 별도 통제 여부 확인 필요",
      },
    ],
    input: "req.params.id",
    sink: "Basket.findOne",
    impact: "타 사용자 객체 접근 가능성",
    reasonTitle: "왜 취약 사례로 분류했나요?",
    reason:
      "장바구니 ID를 기준으로 객체를 조회하는 흐름에서 요청 사용자와 객체 소유자의 관계를 확인하는 조건이 필요합니다. 로그인 여부만으로 특정 객체에 대한 권한이 보장되지는 않습니다.",
    reasons: [
      {
        title: "외부 객체 식별자",
        detail: "경로 값으로 장바구니를 선택합니다.",
      },
      { title: "직접 객체 조회", detail: "식별자가 조회 조건으로 전달됩니다." },
      {
        title: "소유 관계 검증",
        detail: "사용자와 장바구니의 관계를 별도로 확인해야 합니다.",
      },
    ],
    improvementTitle: "사용자와 객체의 관계를 조회 조건에 포함하세요",
    improvement:
      "인증된 사용자 ID와 장바구니 ID를 함께 사용해 소유 관계를 검증하고, 권한이 없으면 객체 존재 여부를 노출하지 않는 응답을 사용하세요.",
    improvementCode:
      "Basket.findOne({\n  where: { id: basketId, UserId: currentUser.id }\n})",
    checks: [
      {
        title: "공통 인가 미들웨어",
        detail: "상위 계층에서 소유권을 검증하는지 확인하세요.",
      },
      {
        title: "장바구니 공유 정책",
        detail: "공유 또는 위임이 허용되는 업무 규칙을 확인하세요.",
      },
      {
        title: "오류 응답 정책",
        detail: "권한 없는 객체의 존재가 노출되지 않는지 확인하세요.",
      },
    ],
    sourceUrl:
      "https://github.com/juice-shop/juice-shop/blob/v19.0.0/routes/basket.ts#L14-L29",
    cweUrl: "https://cwe.mitre.org/data/definitions/639.html",
  },
  {
    id: "TRC-003",
    title: "장바구니 관리자 예외 정책 확인",
    cwe: "정책 맥락 · CWE-639 참고",
    level: "—",
    file: "routes/basket.ts:17",
    type: "확인 필요",
    color: "warning",
    summary:
      "관리자에게 다른 사용자의 장바구니 접근을 허용하는 업무 예외가 있는지 자료로 확인되지 않았습니다.",
    code: "14  router.get('/rest/basket/:id', ...)\n17  const basketId = req.params.id\n20  Basket.findOne({ where: { id: basketId } })\n24  return basket",
    lineLabel: "14–29행",
    evidenceTitle: "업무 정책 자료가 없어 예외 허용 여부를 확정할 수 없습니다.",
    evidenceDescription:
      "같은 장바구니 조회 경로에서 관리자 역할의 접근 범위는 코드만으로 단정하지 않습니다.",
    flow: [
      { title: "역할 확인", detail: "관리자 여부" },
      { title: "객체 접근", detail: "basketId" },
      { title: "정책 대조", detail: "자료 없음" },
    ],
    controls: [
      {
        status: "info",
        title: "관리자 인증",
        detail: "역할 보유와 예외 권한의 범위는 별도 확인",
      },
      {
        status: "info",
        title: "예외 정책 문서",
        detail: "제공된 자료에서 확인되지 않음",
      },
      {
        status: "info",
        title: "감사 통제",
        detail: "예외 접근의 기록 및 승인 절차 확인 필요",
      },
    ],
    input: "관리자 역할 + basketId",
    sink: "Basket.findOne",
    impact: "정책 확인 전 판단 보류",
    reasonTitle: "왜 ‘확인 필요’인가요?",
    reason:
      "관리자가 다른 사용자의 장바구니를 조회할 수 있는지에 대한 업무 정책이 제공되지 않았습니다. 자료 없는 정책을 추정해 취약점으로 확정하지 않고 질문으로 분리합니다.",
    reasons: [
      { title: "관련 코드 위치", detail: "장바구니 조회 경로와 연결됩니다." },
      {
        title: "정책 자료 없음",
        detail: "관리자 예외 범위를 확인할 문서가 없습니다.",
      },
      {
        title: "판정 보류",
        detail: "확인 전에는 취약 사례 합계에 포함하지 않습니다.",
      },
    ],
    improvementTitle: "예외 정책을 먼저 확인하고 통제를 명시하세요",
    improvement:
      "관리자 접근이 허용된다면 대상 범위, 승인 조건, 감사 로그를 정책과 코드에 명확히 연결하세요. 허용되지 않는다면 객체 소유권 통제를 동일하게 적용하세요.",
    checks: [
      {
        title: "관리자 예외 허용 여부",
        detail: "다른 사용자의 장바구니 조회가 업무상 허용되는지 확인하세요.",
      },
      {
        title: "허용 범위와 승인 조건",
        detail: "예외가 있다면 역할·사유·승인 범위를 확인하세요.",
      },
      {
        title: "감사 로그",
        detail: "예외 접근 기록과 사후 검토 절차를 확인하세요.",
      },
    ],
    sourceUrl:
      "https://github.com/juice-shop/juice-shop/blob/v19.0.0/routes/basket.ts#L14-L29",
    cweUrl: "https://cwe.mitre.org/data/definitions/639.html",
  },
]
export const baseSteps = [
  ["입력 확인", "코드 버전과 진단 범위를 확인합니다."],
  ["코드 경로 추적", "관련 코드·설정·호출 경로를 연결합니다."],
  ["문서 맥락", "문서 미제공 · 이 단계만 생략합니다."],
  ["규칙 검증", "검증 사례의 기대값과 대조합니다."],
  ["결과 구성", "근거와 개선 방향을 정리합니다."],
]
