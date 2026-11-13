import { defineComponent } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RunLink } from '../components/RunLink'
import { usePublicSample } from '../workflow'
import { Button, Header } from '../ui'

export const RunUnavailable = defineComponent({ name: 'RunUnavailable', setup() {
  const route = useRoute(), router = useRouter()
  return () => <>
    <Header title="실행을 불러올 수 없습니다"/>
    <main id="main-content" tabindex={-1} class="content v08-flow">
      <section class="v08-stack">
        <div class="v08-notice is-warning" role="status"><strong>요청한 실행 {String(route.query.requestedRun || '')}</strong><p>이 탭에 저장된 실행이 없거나 요청한 실행 정보와 일치하지 않습니다. 공개 표본으로 대체하지 않았습니다.</p><p>현재 시연 기록은 해당 브라우저 탭에 저장됩니다. 다른 탭·기기에서 같은 실행을 조회하려면 진단 서버 연결이 필요합니다.</p></div>
        <div class="v08-actions"><RunLink class="v08-link" to="/runs">분석 기록</RunLink><Button variant="secondary" onClick={() => { usePublicSample(); router.push('/overview') }}>공개 표본 보기</Button></div>
      </section>
    </main>
  </>
} })
