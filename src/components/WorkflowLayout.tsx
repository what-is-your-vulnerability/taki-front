import type { VNodeChild } from 'vue'

export function SectionBand({ title, children }: { title: string; children?: VNodeChild }) {
  return <div class="v08-band"><h2>{title}</h2>{children}</div>
}

export function RunFacts({ rows }: { rows: [string, VNodeChild][] }) {
  return <dl class="v08-facts">{rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
}
