import { describe, expect, it } from 'vitest'
import type { Asset } from '../../data/types'
import { boardReducer, createInitialBoard } from './boardReducer'

const asset: Asset = {
  id: 'test-chair',
  imagePath: '/assets/chair.svg',
  label: 'Chair',
  category: 'Furniture',
  aspectRatio: 2,
}

function twoItems() {
  return boardReducer(
    boardReducer(createInitialBoard(), { type: 'add', id: 'first', asset }),
    {
      type: 'add',
      id: 'second',
      asset,
    },
  )
}

describe('board reducer', () => {
  it('adds centered independent instances with ordered catalogue references', () => {
    const board = twoItems()
    expect(board).toMatchObject({
      version: 1,
      width: 1000,
      height: 700,
      title: 'My room concept',
      paletteId: 'sand',
    })
    expect(board.items).toEqual([
      {
        id: 'first',
        assetId: asset.id,
        x: 410,
        y: 305,
        width: 180,
        height: 90,
      },
      {
        id: 'second',
        assetId: asset.id,
        x: 410,
        y: 305,
        width: 180,
        height: 90,
      },
    ])
    expect(board.items[0]).not.toBe(board.items[1])
  })

  it('moves only the targeted instance, clamps bounds, and leaves the original untouched', () => {
    const board = twoItems()
    const moved = boardReducer(board, {
      type: 'move',
      id: 'first',
      x: 2000,
      y: -10,
    })
    expect(moved.items[0]).toMatchObject({ x: 820, y: 0 })
    expect(moved.items[1]).toBe(board.items[1])
    expect(board.items[0]).toMatchObject({ x: 410, y: 305 })
  })

  it('resizes proportionally, keeps reachable geometry, and preserves other instances', () => {
    const board = twoItems()
    const enlarged = boardReducer(board, {
      type: 'resize',
      id: 'first',
      width: 5000,
    })
    expect(enlarged.items[0]).toMatchObject({
      x: 0,
      y: 200,
      width: 1000,
      height: 500,
    })
    expect(enlarged.items[1]).toBe(board.items[1])
    const reduced = boardReducer(board, {
      type: 'resize',
      id: 'first',
      width: -1,
    })
    expect(reduced.items[0]).toMatchObject({
      x: 410,
      y: 305,
      width: 80,
      height: 40,
    })
  })

  it('removes only the targeted instance and tolerates missing IDs', () => {
    const board = twoItems()
    expect(boardReducer(board, { type: 'remove', id: 'first' }).items).toEqual([
      board.items[1],
    ])
    expect(boardReducer(board, { type: 'remove', id: 'missing' })).toBe(board)
    expect(
      boardReducer(board, { type: 'move', id: 'missing', x: 0, y: 0 }),
    ).toBe(board)
  })

  it('ignores invalid actions, duplicate IDs, and no-op moves', () => {
    const board = twoItems()
    expect(boardReducer(board, { type: 'add', id: 'first', asset })).toBe(board)
    expect(boardReducer(board, { type: 'add', id: ' ', asset })).toBe(board)
    expect(
      boardReducer(board, {
        type: 'add',
        id: 'third',
        asset: { ...asset, id: '' },
      }),
    ).toBe(board)
    expect(
      boardReducer(board, {
        type: 'add',
        id: 'third',
        asset: { ...asset, aspectRatio: Infinity },
      }),
    ).toBe(board)
    expect(
      boardReducer(board, { type: 'move', id: 'first', x: NaN, y: 0 }),
    ).toBe(board)
    expect(
      boardReducer(board, { type: 'resize', id: 'first', width: Infinity }),
    ).toBe(board)
    expect(
      boardReducer(board, { type: 'move', id: 'first', x: 410, y: 305 }),
    ).toBe(board)
    expect(
      boardReducer(board, { type: 'resize', id: 'first', width: 180 }),
    ).toBe(board)
  })
})
