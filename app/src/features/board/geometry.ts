export const BOARD_WIDTH = 1000
export const BOARD_HEIGHT = 700
export const MIN_ITEM_SIZE = 40

export function clientToBoard(
  clientX: number,
  clientY: number,
  rect: { left: number; top: number; width: number; height: number },
) {
  if (rect.width <= 0 || rect.height <= 0) return null
  return {
    x: ((clientX - rect.left) / rect.width) * BOARD_WIDTH,
    y: ((clientY - rect.top) / rect.height) * BOARD_HEIGHT,
  }
}

export function proportionalSize(width: number, aspectRatio: number) {
  if (
    !Number.isFinite(width) ||
    !Number.isFinite(aspectRatio) ||
    aspectRatio <= 0
  )
    return null

  const minimumWidth = Math.max(MIN_ITEM_SIZE, MIN_ITEM_SIZE * aspectRatio)
  const maximumWidth = Math.min(BOARD_WIDTH, BOARD_HEIGHT * aspectRatio)
  // Reject ratios that cannot fit both minimum dimensions on this board.
  if (minimumWidth > maximumWidth) return null

  const nextWidth = Math.min(maximumWidth, Math.max(minimumWidth, width))
  return { width: nextWidth, height: nextWidth / aspectRatio }
}

export function clampPosition(
  size: { width: number; height: number },
  x: number,
  y: number,
) {
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null
  return {
    x: Math.max(0, Math.min(BOARD_WIDTH - size.width, x)),
    y: Math.max(0, Math.min(BOARD_HEIGHT - size.height, y)),
  }
}

export function pointerResize(
  item: { x: number; y: number; width: number; height: number },
  deltaX: number,
) {
  const size = proportionalSize(item.width + deltaX, item.width / item.height)
  if (!size) return null
  const position = clampPosition(size, item.x, item.y)
  return position ? { ...size, ...position } : null
}
