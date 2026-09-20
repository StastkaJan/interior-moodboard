import { describe, expect, it } from 'vitest'
import { clampPosition, clientToBoard, proportionalSize } from './geometry'

describe('logical board geometry', () => {
  it.each([0.25, 0.5, 1, 1.5])(
    'converts client coordinates at display scale %s with a board offset',
    (scale) => {
      const rect = {
        left: 120,
        top: -80,
        width: 1000 * scale,
        height: 700 * scale,
      }
      expect(clientToBoard(120 + 350 * scale, -80 + 210 * scale, rect)).toEqual(
        { x: 350, y: 210 },
      )
      expect(clientToBoard(120 - 50 * scale, -80 + 800 * scale, rect)).toEqual({
        x: -50,
        y: 800,
      })
    },
  )

  it('does not convert an invisible board', () => {
    expect(
      clientToBoard(10, 20, { left: 0, top: 0, width: 0, height: 700 }),
    ).toBeNull()
  })

  it.each([0.5, 1, 1.5, 2])(
    'preserves ratio %s at minimum and maximum size',
    (ratio) => {
      const minimum = proportionalSize(-100, ratio)!
      const maximum = proportionalSize(Number.MAX_VALUE, ratio)!
      for (const size of [minimum, maximum]) {
        expect(size.width / size.height).toBeCloseTo(ratio)
        expect(size.width).toBeGreaterThanOrEqual(40)
        expect(size.height).toBeGreaterThanOrEqual(40)
        expect(size.width).toBeLessThanOrEqual(1000)
        expect(size.height).toBeLessThanOrEqual(700)
      }
      expect(Math.min(minimum.width, minimum.height)).toBe(40)
      expect(maximum.width === 1000 || maximum.height === 700).toBe(true)
    },
  )

  it('rejects non-finite sizes and impossible ratios', () => {
    for (const width of [NaN, Infinity, -Infinity])
      expect(proportionalSize(width, 1)).toBeNull()
    for (const ratio of [NaN, Infinity, 0, -1, 100, 0.001])
      expect(proportionalSize(180, ratio)).toBeNull()
  })

  it('bounds movement using the current size', () => {
    expect(clampPosition({ width: 200, height: 100 }, -30, 900)).toEqual({
      x: 0,
      y: 600,
    })
    expect(clampPosition({ width: 200, height: 100 }, 900, -30)).toEqual({
      x: 800,
      y: 0,
    })
    expect(clampPosition({ width: 200, height: 100 }, 50, 60)).toEqual({
      x: 50,
      y: 60,
    })
    expect(clampPosition({ width: 200, height: 100 }, NaN, 60)).toBeNull()
    expect(clampPosition({ width: 200, height: 100 }, 50, Infinity)).toBeNull()
  })
})
