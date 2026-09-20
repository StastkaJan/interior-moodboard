import { describe, expect, it, vi } from 'vitest'
import { assets } from '../data/assets'
import { palettes } from '../data/palettes'
import {
  boardReducer,
  createInitialBoard,
} from '../features/board/boardReducer'
import type { Board } from '../features/board/types'
import { readBoard, resetBoard, saveBoard, STORAGE_KEY } from './storage'

function memoryStorage(initial: string | null = null) {
  let raw = initial
  return {
    getItem: vi.fn(() => raw),
    setItem: vi.fn((_key: string, value: string) => {
      raw = value
    }),
  }
}

function sampleBoard() {
  const first = boardReducer(createInitialBoard(), {
    type: 'add',
    id: 'first',
    asset: assets[0],
  })
  return boardReducer(first, { type: 'add', id: 'second', asset: assets[0] })
}

describe('board storage', () => {
  it.each(palettes)('round-trips the $label palette', (palette) => {
    const board = { ...sampleBoard(), paletteId: palette.id }
    const storage = memoryStorage()
    expect(saveBoard(board, storage)).toEqual({ status: 'saved' })
    expect(readBoard(storage)).toEqual({ status: 'valid', board })
  })

  it('distinguishes missing records and round-trips durable board fields in order', () => {
    const storage = memoryStorage()
    expect(readBoard(storage)).toEqual({ status: 'absent' })
    const board = sampleBoard()
    expect(saveBoard(board, storage)).toEqual({ status: 'saved' })
    expect(storage.setItem).toHaveBeenCalledWith(
      STORAGE_KEY,
      expect.any(String),
    )
    expect(readBoard(storage)).toEqual({ status: 'valid', board })
  })

  it('serializes only durable fields, even if callers include transient or image data', () => {
    const board = sampleBoard()
    const storage = memoryStorage()
    const withExtras = {
      ...board,
      selection: 'first',
      preview: { x: 50 },
      items: board.items.map((item) => ({
        ...item,
        image: 'data:image/png;base64,x',
      })),
    }
    expect(saveBoard(withExtras, storage).status).toBe('saved')
    expect(readBoard(storage)).toEqual({ status: 'valid', board })
  })

  it.each([
    ['malformed JSON', ' { nope \n'],
    ['null', 'null'],
    ['array', '[]'],
    ['empty record', '{}'],
  ])('preserves %s byte-for-byte through attempted saves', (_name, raw) => {
    const storage = memoryStorage(raw)
    expect(readBoard(storage)).toMatchObject({ status: 'protected', raw })
    expect(saveBoard(sampleBoard(), storage).status).toBe('protected')
    expect(storage.getItem()).toBe(raw)
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  const invalidChanges: [string, (board: Board) => unknown][] = [
    ['newer version', (b) => ({ ...b, version: 2 })],
    ['older version', (b) => ({ ...b, version: 0 })],
    ['wrong dimensions', (b) => ({ ...b, width: 900 })],
    ['unknown palette', (b) => ({ ...b, paletteId: 'unknown' })],
    ['non-string title', (b) => ({ ...b, title: 42 })],
    ['empty title', (b) => ({ ...b, title: ' ' })],
    ['untrimmed title', (b) => ({ ...b, title: ' Room ' })],
    ['long title', (b) => ({ ...b, title: 'a'.repeat(81) })],
    ['unexpected field', (b) => ({ ...b, futureField: true })],
    ['missing items', (b) => ({ ...b, items: undefined })],
    ['null item', (b) => ({ ...b, items: [null] })],
    ['duplicate IDs', (b) => ({ ...b, items: [b.items[0], b.items[0]] })],
    ...[
      ['empty ID', { id: ' ' }],
      ['unknown asset', { assetId: 'unknown' }],
      ['nonfinite x', { x: Infinity }],
      ['nonfinite width', { width: NaN }],
      ['string position', { x: '12' }],
      ['negative x', { x: -1 }],
      ['negative y', { y: -1 }],
      ['right overflow', { x: 999 }],
      ['bottom overflow', { y: 699 }],
      ['too small', { width: 20, height: 13 }],
      ['wrong proportion', { width: 180, height: 180 }],
      ['item transient field', { selected: true }],
    ].map(
      ([name, change]) =>
        [
          name as string,
          (b: Board) => ({
            ...b,
            items: [{ ...b.items[0], ...(change as object) }],
          }),
        ] as [string, (board: Board) => unknown],
    ),
  ]

  it.each(invalidChanges)('protects invalid records: %s', (_name, change) => {
    const raw = JSON.stringify(change(sampleBoard()))
    const storage = memoryStorage(raw)
    expect(readBoard(storage)).toMatchObject({ status: 'protected', raw })
    expect(saveBoard(sampleBoard(), storage).status).toBe('protected')
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('accepts floating-point proportional geometry for every bundled asset', () => {
    for (const asset of assets) {
      const board = boardReducer(createInitialBoard(), {
        type: 'add',
        id: asset.id,
        asset,
      })
      for (const width of [0, 123.456789, 10000]) {
        const resized = boardReducer(board, {
          type: 'resize',
          id: asset.id,
          width,
        })
        const storage = memoryStorage(JSON.stringify(resized))
        expect(readBoard(storage), asset.id).toEqual({
          status: 'valid',
          board: resized,
        })
      }
    }
  })

  it('checks the current record again before saving', () => {
    const storage = memoryStorage()
    expect(readBoard(storage).status).toBe('absent')
    storage.setItem(STORAGE_KEY, '{"version":2}')
    storage.setItem.mockClear()
    expect(saveBoard(sampleBoard(), storage).status).toBe('protected')
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('allows replacement only through explicit reset', () => {
    const storage = memoryStorage('broken original')
    const board = sampleBoard()
    expect(saveBoard(board, storage).status).toBe('protected')
    expect(resetBoard(board, storage)).toEqual({ status: 'saved' })
    expect(readBoard(storage)).toEqual({ status: 'valid', board })
  })

  it('rejects invalid writes and invalid resets without destroying existing data', () => {
    const storage = memoryStorage(JSON.stringify(sampleBoard()))
    const board = { ...sampleBoard(), title: '' }
    expect(saveBoard(board, storage).status).toBe('invalid')
    expect(resetBoard(board, storage).status).toBe('invalid')
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('reports unavailable reads and never writes over inaccessible data', () => {
    const storage = memoryStorage()
    storage.getItem.mockImplementation(() => {
      throw new Error('SecurityError')
    })
    expect(readBoard(storage)).toMatchObject({
      status: 'unavailable',
      message: expect.stringContaining('permissions'),
    })
    expect(saveBoard(sampleBoard(), storage).status).toBe('unavailable')
    expect(storage.setItem).not.toHaveBeenCalled()
  })

  it('reports failed writes and failed reset without claiming success', () => {
    const storage = memoryStorage('protected original')
    storage.setItem.mockImplementation(() => {
      throw new Error('QuotaExceededError')
    })
    expect(resetBoard(sampleBoard(), storage)).toMatchObject({
      status: 'unavailable',
      message: expect.stringContaining('retry'),
    })
    expect(storage.getItem()).toBe('protected original')
    storage.getItem.mockReturnValue(null)
    expect(saveBoard(sampleBoard(), storage).status).toBe('unavailable')
  })

  it('catches denied access to the browser localStorage getter', () => {
    vi.stubGlobal('window', {
      get localStorage() {
        throw new Error('SecurityError')
      },
    })
    try {
      expect(readBoard().status).toBe('unavailable')
      expect(saveBoard(sampleBoard()).status).toBe('unavailable')
      expect(resetBoard(sampleBoard()).status).toBe('unavailable')
    } finally {
      vi.unstubAllGlobals()
    }
  })
})
