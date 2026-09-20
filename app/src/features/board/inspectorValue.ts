import { clampPosition, proportionalSize } from './geometry'
import type { BoardItem } from './types'

export type InspectorField = 'x' | 'y' | 'width'

export function inspectorValue(
  item: BoardItem,
  field: InspectorField,
  text: string,
): number | null {
  if (!text.trim()) return null
  const value = Number(text)
  if (!Number.isFinite(value)) return null
  if (field === 'width')
    return proportionalSize(value, item.width / item.height)?.width ?? null
  return (
    clampPosition(
      item,
      field === 'x' ? value : item.x,
      field === 'y' ? value : item.y,
    )?.[field] ?? null
  )
}
