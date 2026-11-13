import { serviceName } from '../brand'
import {defineComponent} from 'vue'

import {Icon, Badge, Header} from '../ui'

export const Evaluation=defineComponent({name:"Evaluation",props:[],setup(__props,{slots}){

return()=>{

  return (
    <>
      <Header title="평가 및 기준" eyebrow="측정 전" onMenu={() => {}} />
      <main tabindex={-1} class="content">
        <div class="context-bar">
          <div>
            <strong>비교 평가</strong>
            <span>정답 데이터 미등록 · 측정값 없음</span>
          </div>
          <Badge tone="neutral">측정 전</Badge>
        </div>
        <section class="panel comparison">
          <div class="section-head">
            <div>
              <h2>비교 지표</h2>
              <p>비교 평가를 아직 실행하지 않았습니다.</p>
            </div>
            <span class="dot-label">
              <i />
              데이터 없음
            </span>
          </div>
          <div class="comparison-table" tabindex={0} role="region" aria-label="비교 지표 표 · 좌우 이동 가능">
            <div class="comp-head">
              <span>도구</span>
              <span>
                TP <small>정탐</small>
              </span>
              <span>
                FP <small>오탐</small>
              </span>
              <span>
                FN <small>미탐</small>
              </span>
              <span>정밀도</span>
              <span>재현율</span>
            </div>
            {[serviceName, "기존 정적 도구"].map((x) => (
              <div class="comp-row" key={x}>
                <strong>
                  {x}
                  {x === serviceName && <Badge tone="blue">대상</Badge>}
                </strong>
                {['TP · 정탐', 'FP · 오탐', 'FN · 미탐', '정밀도', '재현율'].map((label) => (
                  <span class="no-data" data-label={label} key={label}>
                    —
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>
        <section class="eval-setup">
          <div>
            <h2>평가 데이터</h2>
            <p>전문가가 판정한 취약·정상 사례와 근거 위치</p>
            <Badge tone="neutral">미등록</Badge>
          </div>
          <Icon name="arrow" />
          <div>
            <h2>도구 실행</h2>
            <p>‘{serviceName}’과 비교 대상 정적 도구의 동일 조건 실행</p>
            <Badge tone="neutral">미실행</Badge>
          </div>
          <Icon name="arrow" />
          <div>
            <h2>결과 대조</h2>
            <p>항목·위치 단위로 TP / FP / FN 분류</p>
            <Badge tone="neutral">대기</Badge>
          </div>
        </section>
        <section class="eval-notes">
          <div>
            <Icon name="check" />
            <h2>정답 기준</h2>
            <p>
              취약 유형, 코드 위치, 실행 가능 경로를 전문가가 사전 확정합니다.
            </p>
          </div>
          <div>
            <Icon name="scan" />
            <h2>비교 단위</h2>
            <p>
              단순 경고 수가 아니라 동일 취약 항목과 근거 위치 단위로
              비교합니다.
            </p>
          </div>
          <div>
            <Icon name="info" />
            <h2>평가 기록</h2>
            <p>데이터셋 버전, 도구 설정, 제외 기준을 결과와 함께 기록합니다.</p>
          </div>
        </section>
      </main>
    </>
  )

}
}});
