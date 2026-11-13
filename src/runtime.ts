import {demo} from './session'
import {runContext} from './run-context'
export const documentLabel=()=>demo.withDocument?(runContext.documentName?'선택됨 · 분석 전':'문서 선택 · 분석 전'):'문서 미제공'
