import { describe, expect, it, vi } from 'vitest'
import { copySourceLocation, shortSourceLocation } from './source-location'

describe('근거 경로 표시와 복사',()=>{
  it.each([
    ['routes/login.ts:31','login.ts:31'],
    ['src/deep/path/file.ts:12:4','file.ts:12:4'],
    ['routes/basket.ts:17-24','basket.ts:17-24'],
    ['C:\\repo\\src\\file.ts:8','file.ts:8'],
    ['README.md','README.md'],
  ])('표시에서 파일명·행을 보존한다: %s',(full,short)=>expect(shortSourceLocation(full)).toBe(short))
  it('복사에는 폴더·행·열을 포함한 원래 근거 위치를 전달한다',async()=>{
    const writeText=vi.fn().mockResolvedValue(undefined),full='src/deep/path/file.ts:12:4'
    expect(await copySourceLocation(full,{writeText})).toBe(true)
    expect(writeText).toHaveBeenCalledWith(full)
  })
  it('권한 거절이나 지원 부재를 복사 성공으로 표시하지 않는다',async()=>{
    expect(await copySourceLocation('routes/login.ts:31',{writeText:vi.fn().mockRejectedValue(new Error('denied'))})).toBe(false)
    expect(await copySourceLocation('routes/login.ts:31')).toBe(false)
  })
})
