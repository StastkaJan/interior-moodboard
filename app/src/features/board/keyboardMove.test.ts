import { expect, it } from 'vitest'
import { keyboardMove } from './keyboardMove'

const item = { id: 'a', assetId: 'a', x: 3, y: 2, width: 180, height: 90 }
const event = {
  key: 'ArrowRight',
  shiftKey: false,
  ctrlKey: false,
  altKey: false,
  metaKey: false,
  isComposing: false,
}

it('moves one logical unit or ten with Shift and clamps all board edges', () => {
  expect(keyboardMove(item, event)).toEqual({ x: 4, y: 2 })
  expect(keyboardMove(item, { ...event, key: 'ArrowDown' })).toEqual({
    x: 3,
    y: 3,
  })
  expect(keyboardMove(item, { ...event, shiftKey: true })).toEqual({
    x: 13,
    y: 2,
  })
  expect(
    keyboardMove(item, { ...event, key: 'ArrowLeft', shiftKey: true }),
  ).toEqual({ x: 0, y: 2 })
  expect(
    keyboardMove(item, { ...event, key: 'ArrowUp', shiftKey: true }),
  ).toEqual({ x: 3, y: 0 })
  const edge = { ...item, x: 820, y: 610 }
  expect(keyboardMove(edge, event)).toEqual({ x: 820, y: 610 })
  expect(
    keyboardMove(edge, { ...event, key: 'ArrowDown', shiftKey: true }),
  ).toEqual({ x: 820, y: 610 })
})

it('preserves native modified shortcuts, composition, and unrelated keys', () => {
  for (const modifier of [
    'ctrlKey',
    'altKey',
    'metaKey',
    'isComposing',
  ] as const)
    expect(keyboardMove(item, { ...event, [modifier]: true })).toBeNull()
  expect(keyboardMove(item, { ...event, key: 'Enter' })).toBeNull()
})
