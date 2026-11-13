import { findings } from './data'
import { demo } from './session'
import { activeConnection, runContext } from './run-context'
import { selectedRun } from './workflow'
import { publicJudgmentSample } from './judgments'
import { buildReportModel, type ReportModel } from './report-model'

// Both screens resolve their scope, selection and evidence through this boundary.
export function currentReport(issuedAt = new Date()) {
  const run = selectedRun()
  return buildReportModel(findings, activeConnection.revision, run ? run.design !== 'omitted' : demo.withDocument, {
    ...(run ?? runContext), projectName: activeConnection.project, rootPath: activeConnection.rootPath,
    exampleRun: run ? { id: run.id, createdAt: run.createdAt, partial: run.design === 'partial' } : undefined,
    judgmentSnapshot: activeConnection.mode === 'example' ? publicJudgmentSample : null,
  }, issuedAt)
}

export function findingInReport(report: ReportModel, id: string) {
  return [...report.confirmed, ...report.questions].find(item => item.id === id) ?? null
}
