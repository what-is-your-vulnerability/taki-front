import type {VNode, VNodeChild} from 'vue'
import type {Finding} from './data'
import {defineComponent, cloneVNode} from 'vue'

export type IconName = "grid" | "plus" | "star" | "scan" | "shield" | "file" | "chart" | "search" | "filter" | "arrow" | "chevron" | "check" | "clock" | "alert" | "info" | "code" | "link" | "download" | "menu" | "close" | "book" | "terminal" | "more" | "refresh"
const iconPaths: Record<IconName, VNode> = {
  star: <path d="m12 3 2.78 5.63L21 9.54l-4.5 4.39 1.06 6.2L12 17.2l-5.56 2.93 1.06-6.2L3 9.54l6.22-.91Z" />,
  grid: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5v14M5 12h14" />
    </>
  ),
  scan: (
    <>
      <path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3" />
      <path d="m8.5 12 2.2 2.2 4.8-4.8" />
    </>
  ),
  shield: (
    <>
      <path d="M12 22s8-3.7 8-10V5l-8-3-8 3v7c0 6.3 8 10 8 10Z" />
      <path d="M9 12.2 11 14l4-4" />
    </>
  ),
  file: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-4-4" />
    </>
  ),
  filter: (
    <>
      <path d="M3 5h18M6 12h12M10 19h4" />
    </>
  ),
  arrow: (
    <>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </>
  ),
  chevron: (
    <>
      <path d="m9 18 6-6-6-6" />
    </>
  ),
  check: (
    <>
      <path d="m5 12 4 4L19 6" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  alert: (
    <>
      <path d="M10.3 3.7 2.4 18a2 2 0 0 0 1.8 3h15.6a2 2 0 0 0 1.8-3L13.7 3.7a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </>
  ),
  code: (
    <>
      <path d="m8 9-3 3 3 3M16 9l3 3-3 3M14 5l-4 14" />
    </>
  ),
  link: (
    <>
      <path d="M10 13a5 5 0 0 0 7.5.5l2-2a5 5 0 0 0-7-7l-1.1 1.1" />
      <path d="M14 11a5 5 0 0 0-7.5-.5l-2 2a5 5 0 0 0 7 7l1.1-1.1" />
    </>
  ),
  download: (
    <>
      <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
    </>
  ),
  menu: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12M18 6 6 18" />
    </>
  ),
  book: (
    <>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V3H6.5A2.5 2.5 0 0 0 4 5.5v14Z" />
      <path d="M8 7h8M8 11h6" />
    </>
  ),
  terminal: (
    <>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m7 9 3 3-3 3M13 15h4" />
    </>
  ),
  more: (
    <>
      <circle cx="5" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="19" cy="12" r="1" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5M4 17v-5h5" />
      <path d="M7 7a7 7 0 0 1 11.5 2L20 12M4 12l1.5 3A7 7 0 0 0 17 17" />
    </>
  ),
}
export const Icon=defineComponent({name:"Icon",props:["name","size"],setup(__props,{slots}){

return()=>{
const { name, size = 18 }=__props as  { name: IconName; size?: number };

  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      {cloneVNode(iconPaths[name])}
    </svg>
  )

}
}});
export function DisclosureCue() {
  return <span class="disclosure-cue" aria-hidden="true"><span data-disclosure-closed>펼치기</span><span data-disclosure-open>접기</span><Icon name="chevron" size={18}/></span>
}
export const Badge=defineComponent({name:"Badge",props:["tone"],setup(__props,{slots}){

return()=>{
const {
  tone = "neutral",
}=__props as  {
  children: VNodeChild
  tone?: string
};
const children=slots.default?.();

  return <span class={`badge badge-${tone}`}>{children}</span>

}
}});
export const Button=defineComponent({name:"Button",props:["icon","ariaLabel","variant","onClick","disabled","type"],setup(__props,{slots}){

return()=>{
const {
  icon,
  ariaLabel,
  variant = "primary",
  onClick,
  disabled,
  type = "button",
}=__props as  {
  children: VNodeChild
  icon?: IconName
  ariaLabel?: string
  variant?: string
  onClick?: () => void
  disabled?: boolean
  type?: "button" | "submit"
};
const children=slots.default?.();

  return (
    <button
      type={type}
      aria-label={ariaLabel}
      class={`btn btn-${variant} ${icon ? "btn-has-icon" : "btn-text-only"}`}
      onClick={onClick}
      disabled={disabled}
    >
      {icon && <Icon name={icon} size={16} />}
      <span>{children}</span>
    </button>
  )

}
}});
export const Header=defineComponent({name:"Header",props:["title","eyebrow","actions","onMenu"],setup(__props,{slots}){

return()=>{
const {
  title,
  eyebrow,
  actions,
  onMenu,
}=__props as  {
  title: string
  eyebrow?: string
  actions?: VNodeChild
  onMenu: () => void
};

  return (
    <header class="topbar">
      <button
        class="icon-button mobile-menu"
        aria-label="메뉴 열기"
        onClick={onMenu}
      >
        <Icon name="menu" />
      </button>
      <div class="page-heading">
        {eyebrow && <span>{eyebrow}</span>}
        <h1 tabindex={-1}>{title}</h1>
      </div>
      <div class="top-actions">{actions}</div>
    </header>
  )

}
}});
export const Notice=defineComponent({name:"Notice",props:[],setup(__props,{slots}){

return()=>{

  return (
    <div class="notice">
      <Icon name="info" size={17} />
      <div>
        <strong>공개 예제 시연</strong>
        <span>수동 검토 데이터 · AI 분석 및 규칙 실행 미연결</span>
      </div>
    </div>
  )

}
}});
export const CodeBlock=defineComponent({name:"CodeBlock",props:["finding"],setup(__props,{slots}){

return()=>{
const { finding }=__props as  { finding: Finding };

  return (
    <div class="code-block">
      <div class="code-head">
        <span>{finding.file.split(":")[0]}</span>
        <span class="code-caption">설명용 축약</span>
        <Badge tone={finding.type === "취약 사례" ? "danger" : "warning"}>
          {finding.lineLabel}
        </Badge>
      </div>
      <pre>{finding.code}</pre>
    </div>
  )

}
}});
