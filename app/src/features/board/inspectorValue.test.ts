import { describe, expect, it } from 'vitest'
import { inspectorValue } from './inspectorValue'

const item = {
  id: 'one',
  assetId: 'sofa',
  x: 800,
  y: 500,
  width: 200,
  height: 100,
}

describe('inspector input', () => {
  it.each(['', ' ', 'no number', 'Infinity', '-Infinity', '1e999', 'NaN'])(
    'rejects empty or non-finite input %j',
    (text) => {
      for (const field of ['x', 'y', 'width'] as const)
        expect(inspectorValue(item, field, text)).toBeNull()
    },
  )

  it('accepts fractional logical units without truncation', () => {
    expect(inspectorValue(item, 'x', '123.456')).toBe(123.456)
    expect(inspectorValue(item, 'width', '250.5')).toBe(250.5)
  })

  it('corrects positions and proportional size using the board bounds', () => {
    expect(inspectorValue(item, 'x', '-1')).toBe(0)
    expect(inspectorValue(item, 'x', '9999')).toBe(800)
    expect(inspectorValue(item, 'y', '9999')).toBe(600)
    expect(inspectorValue(item, 'width', '-1')).toBe(80)
    expect(inspectorValue(item, 'width', '9999')).toBe(1000)
    expect(item.width).toBe(200)
  })
})
