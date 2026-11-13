import { defineComponent, h, type PropType } from 'vue'
import { RouterLink, type RouteLocationRaw } from 'vue-router'
import { withRunTarget } from '../navigation'

// Keep the resolved href correct for normal clicks, copied links and new tabs.
export const RunLink = defineComponent({
  name: 'RunLink', inheritAttrs: false,
  props: { to: { type: [String, Object] as PropType<RouteLocationRaw>, required: true }, replace: Boolean },
  setup(props, { attrs, slots }) {
    return () => h(RouterLink, { ...attrs, to: withRunTarget(props.to), replace: props.replace }, slots)
  },
})
