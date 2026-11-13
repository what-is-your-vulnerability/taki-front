import { reportMarkdown } from './domain'
import type { ReportModel } from './report-model'
import { serviceName } from './brand'

const escape = (text: string) => text.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]!)

// Both formats derive from the existing full report, independently of disclosures.
export const reportText = (report: ReportModel) => reportMarkdown(report)
export function reportHtml(report: ReportModel) {
  let code = false
  const content = reportText(report).split('\n').map(line => {
    if (line.startsWith('```')) { code = !code; return code ? '<pre><code>' : '</code></pre>' }
    if (code) return escape(line)+'\n'
    const heading = /^(#{1,6})\s+(.*)$/.exec(line)
    if (heading) return `<h${heading[1].length}>${escape(heading[2])}</h${heading[1].length}>`
    return line ? `<p>${escape(line)}</p>` : ''
  }).join('\n')
  return `<!doctype html><html lang="ko"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(serviceName)} · ${escape(report.project)} 진단 리포트</title><style>body{font:16px/1.7 system-ui,sans-serif;color:#202124;background:#fff;max-width:960px;margin:40px auto;padding:0 24px}h1,h2,h3,h4{line-height:1.5;break-after:avoid}h2{background:#f6f7f9;padding:10px 14px;margin-top:32px}p{margin:6px 0;overflow-wrap:anywhere}pre{background:#f6f7f9;padding:16px;overflow:auto;font:14px/1.7 monospace}code{white-space:pre}@media print{body{margin:0;max-width:none}pre{white-space:pre-wrap;overflow-wrap:anywhere}code{white-space:inherit}}</style></head><body>${content}${code ? '</code></pre>' : ''}</body></html>`
}
