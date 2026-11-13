import { defineComponent } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { Header, Button, Badge } from '../ui'
import { RunFacts, SectionBand } from '../components/WorkflowLayout'

export const ProjectConnection = defineComponent({ name: 'ProjectConnection', setup() {
  const route = useRoute()
  return () => {
    const repository = route.path === '/connect/repositories', permission = route.path === '/connect/permission'
    return <><Header title={permission ? '저장소 권한 확인' : repository ? '저장소 선택' : 'GitHub 저장소 연결'} eyebrow="연결 흐름 예시 · 실제 GitHub App 연동 전" actions={<RouterLink class="v08-link" to="/projects">프로젝트 목록</RouterLink>}/>
      <main id="main-content" tabindex={-1} class="content v08-flow connection-page">
        <div class="v08-grid"><section class="v08-stack">
          <SectionBand title={permission ? '접근 권한이 필요합니다' : repository ? '분석할 저장소' : 'GitHub App 연결'}/>
          {permission ? <><p role="alert">선택한 저장소의 READ 권한을 확인하지 못한 상태 예시입니다. 연결과 분석은 시작하지 않았습니다.</p><RouterLink class="btn btn-secondary" to="/connect">App 연결 다시 확인</RouterLink></> : repository ? <>
            <p class="v08-note">실제 계정의 저장소 목록은 서버 연동 후 표시됩니다.</p>
            <article class="repository-option"><div><strong>juice-shop/juice-shop</strong><p>v19.0.0 · 공개 수동 검토 표본</p></div><Badge>공개 예제</Badge></article>
            <RouterLink class="btn btn-primary" to="/new">공개 예제로 계속</RouterLink>
            <RouterLink class="v08-link" to="/connect/permission">권한 오류 상태 보기</RouterLink>
          </> : <>
            <p>GitHub App에서 분석할 저장소에 대한 읽기 권한을 허용합니다.</p>
            <div class="v08-well"><RunFacts rows={[[ '등록 방식', 'GitHub App' ],[ '분석 범위', '인가된 저장소 전체 READ' ],[ '원본 코드', '변경·삭제하지 않음' ]]}/></div>
            <Button disabled>GitHub App 연결 · 연동 전</Button>
            <RouterLink class="v08-link" to="/connect/repositories">저장소 선택 예시 보기</RouterLink>
          </>}
        </section><aside class="v08-stack"><SectionBand title="연결 후 확인할 정보"/><div class="v08-well"><RunFacts rows={[[ '저장소', '조직 / 저장소 이름' ],[ '권한', '저장소 전체 READ' ],[ '코드 버전', '브랜치·고정 커밋' ],[ '진단', '프로젝트 등록 후 별도 실행' ]]}/></div><p class="v08-note">이 화면은 연결 상태 시안입니다. 계정 권한을 요청하거나 저장소를 등록하지 않습니다.</p></aside></div>
      </main></>
  }
} })
