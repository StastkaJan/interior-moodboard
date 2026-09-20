import { clampPosition } from './geometry'
import type { BoardItem } from './types'

export function keyboardMove(
  item: BoardItem,
  event: Pick<
    KeyboardEvent,
    'key' | 'shiftKey' | 'ctrlKey' | 'altKey' | 'metaKey' | 'isComposing'
  >,
) {
  if (event.ctrlKey || event.altKey || event.metaKey || event.isComposing)
    return null
  const step = event.shiftKey ? 10 : 1
  switch (event.key) {
    case 'ArrowLeft':
      return clampPosition(item, item.x - step, item.y)
    case 'ArrowRight':
      return clampPosition(item, item.x + step, item.y)
    case 'ArrowUp':
      return clampPosition(item, item.x, item.y - step)
    case 'ArrowDown':
      return clampPosition(item, item.x, item.y + step)
    default:
      return null
  }
}
