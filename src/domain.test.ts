import { describe, expect, it } from 'vitest'
import { findings } from './data'
import { createReport, filterFindings, summarize } from './domain'
import { publicJudgmentSample } from './judgments'
describe('판정과 출처를 유지하는 결과 표시',()=>{
  it('업무 정책 질문을 취약점으로 집계하지 않는다',()=>{expect(summarize(findings)).toEqual({vulnerabilities:2,review:1})})
  it('확인 필요 판정과 코드 검색 조건을 함께 적용한다',()=>{expect(filterFindings(findings,' BASKET.TS ','review').map(f=>f.id)).toEqual(['TRC-003'])})
  it('일치하는 결과가 없으면 기존 발견을 표시하지 않는다',()=>{expect(filterFindings(findings,'없는파일.py','all')).toHaveLength(0)})
  it('문서가 없는 리포트는 문서 인용 없이 코드 단독으로 출력한다',()=>{const report=createReport(findings,'v19.0.0',false);expect(report).toContain('미제공 — 코드 단독 경로');expect(report).toContain('실제 수행한 결과가 아닙니다');for(const f of findings)expect(report).toContain(f.sourceUrl)})
  it('선택한 기준만 리포트에 연결하며 미선택 기준을 적용했다고 쓰지 않는다',()=>{const report=createReport(findings,'v19.0.0',true,{rootPath:'/examples/juice-shop',documentName:'설계.md',criterionIds:['CR-001','unknown']});expect(report).toContain('CR-001');expect(report).not.toContain('CR-002');expect(report).not.toContain('unknown');expect(report).toContain('설계.md');expect(report).toContain('실제 경로 접근 미수행')})
  it('문서를 선택해도 내용 분석이 완료됐다고 주장하지 않는다',()=>{expect(createReport(findings,'v19.0.0',true)).toContain('내용 분석 미수행')})
  it('다운로드 리포트에 표본 등급과 결정 취약점의 위치·원본을 포함하고 정책 질문은 원인에서 제외한다',()=>{
    const report=createReport(findings,'v19.0.0',false,{judgmentSnapshot:publicJudgmentSample})
    const gradeSection=report.split('## 보안 등급')[1].split('## 선택 자료')[0]
    expect(gradeSection).toContain('**D · 표본 기준**')
    expect(gradeSection).toContain('수동 판정 표본 · 전체 코드 결과 아님')
    expect(gradeSection).toContain('등급 결정 취약점 2건')
    for(const item of findings.filter(f=>f.type==='취약 사례')){
      expect(gradeSection).toContain(item.id)
      expect(gradeSection).toContain(item.file)
      expect(gradeSection).toContain(item.sourceUrl)
    }
    expect(gradeSection).not.toContain('TRC-003')
    expect(gradeSection).toContain('확인 필요 항목은 등급에서 제외')
  })
  it('등급 근거가 없는 리포트는 A나 예제 D를 부여하지 않고 미측정으로 내보낸다',()=>{
    const report=createReport(findings,'v19.0.0',false)
    const gradeSection=report.split('## 보안 등급')[1].split('## 선택 자료')[0]
    expect(gradeSection).toContain('보안 등급: 미측정')
    expect(gradeSection).not.toContain('표본 기준')
    expect(gradeSection).not.toContain('TRC-001')
  })
})
