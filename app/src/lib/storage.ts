import { assets } from '../data/assets'
import { palettes } from '../data/palettes'
import {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  MIN_ITEM_SIZE,
} from '../features/board/geometry'
import type { Board, BoardItem } from '../features/board/types'

export const STORAGE_KEY = 'interior-moodboard:v1'

type BoardStorage = Pick<Storage, 'getItem' | 'setItem'>
export type ReadResult =
  | { status: 'absent' }
  | { status: 'valid'; board: Board }
  | { status: 'protected'; raw: string; message: string }
  | { status: 'unavailable'; message: string }
export type WriteResult =
  | { status: 'saved' }
  | { status: 'protected' | 'unavailable' | 'invalid'; message: string }

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function hasOnly(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).every((key) => keys.includes(key))
}

function validBoard(value: unknown): value is Board {
  if (
    !record(value) ||
    !hasOnly(value, [
      'version',
      'title',
      'width',
      'height',
      'paletteId',
      'items',
    ]) ||
    value.version !== 1 ||
    value.width !== BOARD_WIDTH ||
    value.height !== BOARD_HEIGHT ||
    typeof value.title !== 'string' ||
    !value.title.trim() ||
    value.title !== value.title.trim() ||
    value.title.length > 80 ||
    !palettes.some((palette) => palette.id === value.paletteId) ||
    !Array.isArray(value.items)
  )
    return false

  const ids = new Set<string>()
  return value.items.every((item: unknown) => {
    if (
      !record(item) ||
      !hasOnly(item, ['id', 'assetId', 'x', 'y', 'width', 'height']) ||
      typeof item.id !== 'string' ||
      !item.id.trim() ||
      ids.has(item.id) ||
      !['x', 'y', 'width', 'height'].every(
        (key) => typeof item[key] === 'number' && Number.isFinite(item[key]),
      )
    )
      return false
    const asset = assets.find((entry) => entry.id === item.assetId)
    if (!asset) return false
    const { x, y, width, height } = item as BoardItem
    ids.add(item.id)
    return (
      x >= 0 &&
      y >= 0 &&
      width >= MIN_ITEM_SIZE &&
      height >= MIN_ITEM_SIZE &&
      x + width <= BOARD_WIDTH + 1e-9 &&
      y + height <= BOARD_HEIGHT + 1e-9 &&
      Math.abs(width - height * asset.aspectRatio) <= 1e-9 * width
    )
  })
}

function durableBoard(board: Board): Board {
  return {
    version: board.version,
    title: board.title,
    width: board.width,
    height: board.height,
    paletteId: board.paletteId,
    items: board.items.map(({ id, assetId, x, y, width, height }) => ({
      id,
      assetId,
      x,
      y,
      width,
      height,
    })),
  }
}

export function readBoard(storage?: BoardStorage): ReadResult {
  let raw: string | null
  try {
    raw = (storage ?? window.localStorage).getItem(STORAGE_KEY)
  } catch {
    return {
      status: 'unavailable',
      message:
        'Saved data could not be read. Check browser storage permissions; edits remain in this session.',
    }
  }
  if (raw === null) return { status: 'absent' }
  try {
    const value: unknown = JSON.parse(raw)
    if (validBoard(value)) return { status: 'valid', board: value }
  } catch {
    // Keep the original bytes for malformed JSON as well as unsupported records.
  }
  return {
    status: 'protected',
    raw,
    message:
      'Saved data is unreadable or incompatible. It is preserved until you explicitly replace it.',
  }
}

function writeBoard(board: Board, storage?: BoardStorage): WriteResult {
  try {
    const durable = durableBoard(board)
    if (!validBoard(durable))
      return {
        status: 'invalid',
        message: 'This board cannot be saved because its data is invalid.',
      }
    ;(storage ?? window.localStorage).setItem(
      STORAGE_KEY,
      JSON.stringify(durable),
    )
    return { status: 'saved' }
  } catch {
    return {
      status: 'unavailable',
      message:
        'Changes could not be saved. Check storage permissions or free browser storage, then retry.',
    }
  }
}

export function saveBoard(board: Board, storage?: BoardStorage): WriteResult {
  const current = readBoard(storage)
  if (current.status === 'protected' || current.status === 'unavailable')
    return { status: current.status, message: current.message }
  return writeBoard(board, storage)
}

// Call only after the user explicitly chooses to replace the saved record.
export function resetBoard(board: Board, storage?: BoardStorage): WriteResult {
  return writeBoard(board, storage)
}
