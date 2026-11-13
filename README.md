# taki-front · 너의 취약점은

보안 진단 플랫폼 **너의 취약점은**의 화면 프로토타입입니다. 기존 배포본 **0.14.2**의 Vue 소스·테스트·브랜드 자산·PDF 글꼴을 담았습니다.

- 기준 소스: `4d061b88fe541fb0f3e23acf478bd175c60384c4`
- 최종 Figma: [PC·모바일·공통 컴포넌트](https://www.figma.com/design/WyrqKAJ7twpfPEIyyvZ1HL)
- 배포 화면: [너의 취약점은](https://trace-web-security-vue.gggdesigner0905.chatgpt.site)

## 시작하기

Node.js와 npm이 필요합니다. 현재 의존성의 Node.js 지원 범위는 **20.19 이상인 20.x, 22.12 이상인 22.x, 또는 24 이상**입니다. 준비 작업에서 사용한 환경은 Node.js **26.5.0**, npm **12.0.1**입니다.

```bash
npm ci
npm run dev
```

브라우저에서 **http://127.0.0.1:5174/** 를 엽니다. 기본 화면은 개요이며 프로젝트 목록은 `/#/projects`입니다. 포트 5174가 사용 중이면 다른 개발 서버를 종료하거나 `npm run dev -- --port 5175`로 실행하세요.

현재 시연에는 환경 변수나 API 키가 필요하지 않습니다. 실제 API 주소를 읽는 설정은 아직 없으므로, 임의의 `.env` 항목을 추가해도 백엔드가 연결되지는 않습니다.

## 확인 명령

| 명령 | 용도 |
| --- | --- |
| `npm run dev` | 개발 서버 실행 |
| `npm test` | 기존 단위 테스트 실행 |
| `npm run typecheck` | TypeScript·Vue 타입 검사 |
| `npm run build` | 타입 검사 후 `dist/` 생성 |
| `npm run preview` | 빌드 결과 미리 보기. 표시되는 로컬 주소로 접속 |

일반 정적 호스팅에는 `dist/`의 내용을 배포합니다. 라우팅은 `/#/overview` 형태의 해시 주소를 사용합니다. 하위 경로에 배포한다면 `vite.config.ts`의 `base` 설정을 배포 경로에 맞춰야 합니다. 미리 보기 서버는 개발 확인용입니다.

## 프로젝트 구조

```text
src/
  main.ts                앱 시작·라우터
  App.tsx                공통 탐색·화면 연결
  screens/               프로젝트·진단·이슈·리포트 등 화면
  components/            공통 화면 요소
  data.ts                공개 예제 데이터
  workflow.ts            시연 진단 흐름
  session.ts             탭 단위 시연 상태
  judgments.ts           판정 집계
  security-grade.ts      표본 보안 등급 계산
  report-model.ts        화면·내려받기 공통 리포트 모델
  report-export.ts       HTML·TXT 내려받기
  report-pdf.ts          PDF 생성
  *.test.ts              기존 단위 테스트
public/
  fonts/                 PDF 한글 글꼴
  licenses/              사용 글꼴·자산의 라이선스
```

**Vue 3 + TypeScript + Vite + Vue Router** 기반입니다. 화면 파일은 Vue용 JSX 설정을 사용하는 **`.tsx`** 형식이며 React 프로젝트가 아닙니다. TanStack Vue Query, Ant Design Vue 아이콘, pdfmake 등 기존 의존성과 잠금 파일을 유지했습니다.

## 화면과 현재 동작

| 경로 | 내용 |
| --- | --- |
| `/#/projects` | 프로젝트 목록·검색·등급 필터 |
| `/#/overview` | 진단 개요·표본 등급·판정 집계 |
| `/#/connect` | GitHub App 연결 전 안내 |
| `/#/connect/repositories` | 저장소 선택 예시 |
| `/#/new`, `/#/progress`, `/#/runs` | 공개 예제 진단 요청·진행 시연·기록 |
| `/#/findings`, `/#/findings/TRC-001` | 판정 목록·코드 근거·업무 영향·검증 수준 |
| `/#/code-report/TRC-001` | 별도 코드 근거 리포트 |
| `/#/report` | D2 요약 대시보드·상세 펼침·내려받기·결과 관리 |
| `/#/criteria`, `/#/rules` | 적용 기준·Rule 조회·보완 요청 시안 |
| `/#/security`, `/#/code`, `/#/measures` | 보안 검토·코드 탐색·측정값 |
| `/#/quality-gate`, `/#/profiles`, `/#/settings` | Gate·규칙 프로필·프로젝트 설정 시안 |
| `/#/validation` | 비교 평가의 기준과 미측정 상태 |

공개 예제는 **OWASP Juice Shop v19.0.0의 수동 검토 표본**입니다. 위반 2개·확인 필요 1개와 표본 등급 D는 해당 예제의 설명용 결과이며, 전체 저장소의 진단 실측이나 실제 서비스의 보안 등급이 아닙니다. HTML·TXT·PDF는 같은 리포트 모델의 전체 상세를 사용합니다.

## 백엔드 연결 범위

화면과 서버 구현 완료를 구분해야 합니다.

- GitHub App 설치·로그인·저장소 권한 확인·실제 코드 읽기·분석 실행 API는 연결 전입니다.
- 선택한 문서는 실제 서버로 전송·추출·분석하지 않습니다. 파일 내용은 업로드되지 않습니다.
- 시연 진단·메모·조건 등의 상태는 브라우저의 현재 탭에 저장됩니다. 서버 보관·다른 기기 공유·실제 권한 통제를 대신하지 않습니다.
- 결과 관리의 삭제는 시연 상태에만 적용됩니다. 실제 결과의 30일 보관·즉시 삭제·인증은 서버 연결 후 구현·검증해야 합니다.
- `src/agent.ts`에는 과거 경로 기반 연결 경계가 남아 있지만 현재 사용자 등록 화면은 **GitHub 연결 흐름**입니다. 해당 내부 코드를 현재 API 계약으로 사용하지 마세요.
- API·인증 연결 시 `src/screens/ProjectConnection.tsx`, `src/screens/NewScan.tsx`, `src/workflow.ts`, `src/navigation.ts`와 공통 리포트 모델을 함께 확인하세요. 실제 계약은 팀의 최신 API 설계서를 따릅니다.

현재 소스가 최신 기획의 모든 Java 진단 요구사항을 구현했다는 뜻은 아닙니다. 이번 이관은 배포된 화면 기준을 보존한 것입니다.

## Git 업로드

이 저장소 자체가 프론트엔드 프로젝트 루트입니다. 저장소는 [what-is-your-vulnerability/taki-front](https://github.com/what-is-your-vulnerability/taki-front)입니다.

- `src/`, `public/`, `package.json`, `package-lock.json`, TypeScript·Vite 설정과 이 안내를 올립니다.
- `node_modules/`, `dist/`, 임시 PDF·테스트 결과·개인 환경 변수·키 파일은 `.gitignore`로 제외합니다.
- 과거 디자인 시안, 기존 Site의 배포 설정과 Git 이력은 이 폴더에 포함하지 않았습니다.
- 기존 팀 저장소에 합칠 때는 해당 저장소를 먼저 복제하고, 정해진 프론트 폴더에 이 프로젝트 파일을 넣습니다. 내부 `.git` 폴더를 복사하거나 기존 저장소 위에서 새 이력을 덮어쓰지 마세요.
- 새 빈 저장소를 연결하는 경우에도 `git status`로 올릴 파일을 확인한 뒤 진행합니다. 기존 내용이 있는 원격 저장소에는 강제 업로드하지 않습니다.

폰트·자산의 라이선스 파일은 함께 유지합니다. 프로젝트 전체의 공개 라이선스는 이번 준비 작업에서 새로 지정하지 않았습니다.

## 프론트 PR 작성

[PR 템플릿](.github/pull_request_template.md)은 **변경 요약 · Figma 링크 · PC·모바일 전후 이미지 · 검증 결과** 네 항목으로 구성했습니다. 기준 Figma 링크는 미리 넣었으며 변경 프레임 링크는 PR마다 입력합니다.

1. 저장소 최상위의 `.github/pull_request_template.md`를 **기본 브랜치**에 반영합니다. 이후 새 PR을 만들면 본문에 양식이 자동으로 들어갑니다. [GitHub 공식 안내](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/creating-a-pull-request-template-for-your-repository)
2. 팀 저장소의 `frontend/` 하위에 Vue를 넣더라도 템플릿은 **저장소 최상위 `.github/`**에 둡니다. 기존 PR 양식이 있으면 덮어쓰기 전에 팀 양식과 합칩니다.
3. PR 본문에 이미지를 끌어다 놓거나 붙여넣어 업로드한 뒤, 생성된 `![설명](URL)`을 전·후 표의 해당 셀에 넣습니다. 변경 항목마다 표를 복제해 번호를 붙입니다. 로컬 파일 주소 대신 GitHub 첨부 이미지를 사용합니다. [이미지 첨부 안내](https://docs.github.com/en/get-started/writing-on-github/working-with-advanced-formatting/attaching-files)
4. PC 전·후는 같은 해상도, 모바일 전·후는 390×844에서 같은 입력·조작으로 비교합니다. 이미지에는 변경 위치를 번호나 박스로 표시하고, 원본 캡처는 보존합니다. 이전 캡처가 없으면 그 사실을 적습니다.
5. Figma는 해당 프레임을 선택해 링크를 복사하고, 리뷰어가 링크를 열 수 있는지 확인합니다. 리뷰 담당자는 PR 오른쪽 **Reviewers**, 작업 보드는 팀에서 사용하는 경우 **Projects**에서 별도로 선택합니다.

PR 양식은 네 항목을 유지합니다. 관련 작업·미검증 사항·다른 파트 영향은 변경 요약과 검증 결과 안에 필요한 만큼 적습니다. 리뷰 담당자와 보드는 PR에서 지정하며, 기존 CODEOWNERS와 브랜치 보호 규칙을 따릅니다.

## 팀 Git Flow

팀의 [공통 협업 규칙](https://github.com/what-is-your-vulnerability/.github/blob/main/CONTRIBUTING.md)을 따릅니다.

- 최신 `dev`에서 `feature/번호-설명`, `fix/번호-설명`, `docs/번호-설명`, `chore/번호-설명` 등 작업 브랜치를 만들고 `dev` 대상으로 PR을 엽니다.
- `main`·`dev` 직접 push와 force push는 금지합니다. 작업 브랜치 → `dev`는 **Squash and merge**, 배포 시 `dev` → `main`은 **Create a merge commit**을 사용합니다.
- 커밋·PR 제목은 `feat: 변경 내용`처럼 작성하고, 관련 Jira가 있으면 `[KAN-번호]`를 선택적으로 붙입니다.
- Assignees에는 작성자를, Reviewers에는 리뷰 담당자를 지정합니다. `.github/` 등 인프라 파일은 기존 CODEOWNERS에 따라 인프라 담당이 리뷰합니다.
- `dev` 병합에는 필수 검사 `test`가 통과해야 합니다. `main`에는 `test`와 `main-source-guard`가 필요합니다. 미완성 작업은 Draft PR로 공유합니다.
- 현재 CI는 Node.js 22에서 설치·타입 검사·테스트·빌드를 실행합니다. `type-check`는 `typecheck`와 같은 검사입니다. 별도 lint 스크립트는 아직 없어 해당 CI 단계는 건너뜁니다.
- `.env`, `taki.yml`과 API 키 등 비밀값은 커밋하지 않습니다. 공개 빌드의 `VITE_` 변수에도 비밀값을 넣지 않습니다.

운영 배포는 정적 파일을 빌드해 API와 같은 도메인에서 서빙하는 구성을 기준으로 합니다. 실제 서버·호스팅 설정은 인프라 구성에서 다룹니다.
