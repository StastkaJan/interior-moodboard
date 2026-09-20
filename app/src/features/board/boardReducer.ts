import type { Asset } from '../../data/types'
import { palettes } from '../../data/palettes'
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  clampPosition,
  proportionalSize,
} from './geometry'
import type { Board, BoardItem } from './types'

export type BoardAction =
  | { type: 'rename'; title: string }
  | { type: 'palette'; paletteId: string }
  | { type: 'add'; id: string; asset: Asset }
  | { type: 'move'; id: string; x: number; y: number }
  | { type: 'resize'; id: string; width: number }
  | { type: 'remove'; id: string }
  | { type: 'reorder'; id: string; direction: 'forward' | 'backward' }

export const DEFAULT_BOARD_TITLE = 'My room concept'
export const MAX_BOARD_TITLE_LENGTH = 80

export function createInitialBoard(): Board {
  return {
    version: 1,
    title: DEFAULT_BOARD_TITLE,
    width: BOARD_WIDTH,
    height: BOARD_HEIGHT,
    paletteId: 'sand',
    items: [],
  }
}

export function boardReducer(board: Board, action: BoardAction): Board {
  if (action.type === 'rename') {
    const title =
      action.title.trim().slice(0, MAX_BOARD_TITLE_LENGTH).trim() ||
      DEFAULT_BOARD_TITLE
    return title === board.title ? board : { ...board, title }
  }
  if (action.type === 'palette') {
    return action.paletteId === board.paletteId ||
      !palettes.some((palette) => palette.id === action.paletteId)
      ? board
      : { ...board, paletteId: action.paletteId }
  }
  if (action.type === 'add') {
    if (
      !action.id.trim() ||
      !action.asset.id.trim() ||
      board.items.some((item) => item.id === action.id)
    )
      return board
    const size = proportionalSize(180, action.asset.aspectRatio)
    if (!size) return board
    const item: BoardItem = {
      id: action.id,
      assetId: action.asset.id,
      ...size,
      x: (BOARD_WIDTH - size.width) / 2,
      y: (BOARD_HEIGHT - size.height) / 2,
    }
    return { ...board, items: [...board.items, item] }
  }

  const item = board.items.find((entry) => entry.id === action.id)
  if (!item) return board
  if (action.type === 'reorder') {
    const index = board.items.indexOf(item)
    const target = index + (action.direction === 'forward' ? 1 : -1)
    if (target < 0 || target >= board.items.length) return board
    const items = [...board.items]
    ;[items[index], items[target]] = [items[target], items[index]]
    return { ...board, items }
  }
  if (action.type === 'remove')
    return {
      ...board,
      items: board.items.filter((entry) => entry.id !== action.id),
    }

  const size =
    action.type === 'resize'
      ? proportionalSize(action.width, item.width / item.height)
      : { width: item.width, height: item.height }
  if (!size) return board
  const position = clampPosition(
    size,
    action.type === 'move' ? action.x : item.x,
    action.type === 'move' ? action.y : item.y,
  )
  if (!position) return board
  if (
    size.width === item.width &&
    size.height === item.height &&
    position.x === item.x &&
    position.y === item.y
  )
    return board
  return {
    ...board,
    items: board.items.map((entry) =>
      entry.id === item.id ? { ...item, ...size, ...position } : entry,
    ),
  }
}
