import { describe, expect, it } from 'vitest'
import { normalizeProgress, nextDemoStage } from './session'
describe('preview progress restored from browser storage',()=>{
  it('recovers safely from absent or malformed state',()=>{
    for(const input of [null,'broken',42,undefined]) expect(normalizeProgress(input)).toEqual({stage:0,withDocument:false,documentFailed:false})
    expect(normalizeProgress({stage:Infinity})).toHaveProperty('stage',0)
  })
  it('constrains the restored stage to available steps',()=>{
    expect(normalizeProgress({stage:99})).toHaveProperty('stage',5)
    expect(normalizeProgress({stage:-4})).toHaveProperty('stage',0)
    expect(normalizeProgress({stage:2.7})).toHaveProperty('stage',2)
  })
  it('does not treat an absent document as a failed document',()=>{
    expect(normalizeProgress({withDocument:false,documentFailed:true})).toHaveProperty('documentFailed',false)
    expect(normalizeProgress({withDocument:true,documentFailed:true})).toHaveProperty('documentFailed',true)
  })
  it('skips only the optional context stage, without skipping code or rule review',()=>{
    expect(nextDemoStage(0,false)).toBe(1)
    expect(nextDemoStage(1,false)).toBe(3)
    expect(nextDemoStage(1,true)).toBe(2)
    expect(nextDemoStage(4,false)).toBe(5)
    expect(nextDemoStage(5,true)).toBe(5)
  })
})
