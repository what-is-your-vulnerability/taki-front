# taki-front

TAKI 진단 서비스의 프론트엔드입니다. Vue 3 + TypeScript + Vite로 만들고, 정적 파일로 빌드해 API와 같은 도메인에서 서빙합니다.

- 협업 규칙(브랜치, PR, 병합 방식): [조직 CONTRIBUTING.md](https://github.com/what-is-your-vulnerability/.github/blob/main/CONTRIBUTING.md)
- 브랜치 흐름: `작업 브랜치 → dev → main`. `dev`는 squash, `main`은 merge commit으로 합칩니다.
- 비밀값(`.env` 등)은 커밋하지 않습니다. 빌드 결과는 누구나 볼 수 있으므로 `VITE_` 환경변수에도 비밀값을 넣지 않습니다.
