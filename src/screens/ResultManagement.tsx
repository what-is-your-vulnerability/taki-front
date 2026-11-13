import { defineComponent, ref, type PropType } from 'vue'
import type { ReportModel } from '../report-model'
import { Button } from '../ui'
import { RunFacts } from '../components/WorkflowLayout'

export const ResultManagement = defineComponent({ name: 'ResultManagement', props: { report: { type: Object as PropType<ReportModel>, required: true } }, setup(props) {
  const dialog = ref<HTMLDialogElement | null>(null)
  return () => {
    const report = props.report
    return <section class="result-management" aria-label="결과 보관 및 삭제">
      <RunFacts rows={[[ '보관 기간', '실행 종료부터 30일' ],[ '조회·다운로드', '소속 프로젝트 / 담당 조직 범위' ],[ '즉시 삭제', '담당 조직 보안담당자' ]]}/>
      <div class="result-delete-row"><p class="v08-note">이 실행의 결과·근거만 삭제 대상입니다. 원본 GitHub는 유지합니다.</p><Button variant="ghost" onClick={() => dialog.value?.showModal()}>삭제 범위 확인</Button></div>
      <p class="v08-note">공개 예제 · 권한·삭제 API 연동 전. 실행 종료 시각이 없어 만료일은 계산하지 않습니다.</p>
      <dialog class="v08-dialog result-delete-dialog" ref={dialog} aria-labelledby="result-delete-title"><h2 id="result-delete-title">진단 결과를 삭제할까요?</h2><p>{report.project} · {report.version}</p><RunFacts rows={[[ '삭제 대상', '이 실행의 결과·코드 근거' ],[ '제외 대상', '원본 GitHub 저장소' ],[ '필요 권한', '담당 조직 보안담당자' ]]}/><p class="v08-note">권한과 삭제 API 연결 후 사용할 수 있습니다.</p><div class="v08-actions"><Button variant="secondary" onClick={() => dialog.value?.close()}>취소</Button><Button disabled>삭제 · 실제 연동 전</Button></div></dialog>
    </section>
  }
} })
