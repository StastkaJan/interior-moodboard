import { assets } from '../../data/assets'
import { palettes } from '../../data/palettes'
import { BoardItem } from './BoardItem'
import { clampPosition, clientToBoard, pointerResize } from './geometry'
import type { Board, BoardItem as BoardItemData } from './types'
import styles from './BoardCanvas.module.css'

type BoardCanvasProps = {
  board: Board
  selectedId: string | null
  onSelect: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
  onResize: (id: string, width: number) => void
}

export function BoardCanvas({
  board,
  selectedId,
  onSelect,
  onMove,
  onResize,
}: BoardCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<{
    pointerId: number
    kind: 'move' | 'resize'
    item: BoardItemData
    offset: { x: number; y: number }
  } | null>(null)
  const [preview, setPreview] = useState<BoardItemData | null>(null)
  const selected = board.items.find((item) => item.id === selectedId)
  const displayedSelected = preview?.id === selectedId ? preview : selected

  function startGesture(
    event: PointerEvent<HTMLButtonElement>,
    item: BoardItemData,
    kind: 'move' | 'resize',
  ) {
    if (gesture.current || event.button !== 0 || !canvasRef.current) return
    const point = clientToBoard(
      event.clientX,
      event.clientY,
      canvasRef.current.getBoundingClientRect(),
    )
    if (!point) return
    event.currentTarget.setPointerCapture(event.pointerId)
    gesture.current = {
      pointerId: event.pointerId,
      kind,
      item,
      offset: { x: point.x - item.x, y: point.y - item.y },
    }
    onSelect(item.id)
    setPreview(item)
  }

  function gestureGeometry(event: PointerEvent) {
    const active = gesture.current
    if (!active || active.pointerId !== event.pointerId || !canvasRef.current)
      return null
    const point = clientToBoard(
      event.clientX,
      event.clientY,
      canvasRef.current.getBoundingClientRect(),
    )
    if (!point) return null
    if (active.kind === 'resize')
      return pointerResize(
        active.item,
        point.x - active.offset.x - active.item.x,
      )
    const position = clampPosition(
      active.item,
      point.x - active.offset.x,
      point.y - active.offset.y,
    )
    return position ? { ...active.item, ...position } : null
  }

  function cancelGesture(event: PointerEvent) {
    if (gesture.current?.pointerId !== event.pointerId) return
    gesture.current = null
    setPreview(null)
  }

  return (
    <div
      ref={canvasRef}
      onPointerMove={(event) => {
        const position = gestureGeometry(event)
        if (position && gesture.current)
          setPreview({ ...gesture.current.item, ...position })
      }}
      onPointerUp={(event) => {
        const position = gestureGeometry(event)
        const active = gesture.current
        if (!active || active.pointerId !== event.pointerId) return
        cancelGesture(event)
        if (position) {
          if (active.kind === 'resize') onResize(active.item.id, position.width)
          else onMove(active.item.id, position.x, position.y)
        }
      }}
      onPointerCancel={cancelGesture}
      onLostPointerCapture={cancelGesture}
      className={styles.canvas}
      style={{
        backgroundColor: palettes.find(
          (palette) => palette.id === board.paletteId,
        )?.background,
      }}
      role="group"
      aria-label="Moodboard items"
    >
      {board.items.length === 0 && (
        <div className={styles.empty}>
          <p>A little room for your ideas.</p>
          <span>Add an object or material from the collection to begin.</span>
        </div>
      )}
      {board.items.map((item, index) => {
        const asset = assets.find((entry) => entry.id === item.assetId)
        return asset ? (
          <BoardItem
            key={item.id}
            item={preview?.id === item.id ? preview : item}
            asset={asset}
            board={board}
            index={index}
            selected={selectedId === item.id}
            onSelect={onSelect}
            onPointerDown={(event) => startGesture(event, item, 'move')}
            dragging={preview?.id === item.id}
          />
        ) : null
      })}
      {selected && displayedSelected && (
        <button
          type="button"
          className={styles.resizeHandle}
          aria-label="Resize selected item"
          title="Drag horizontally to resize, or use the Width field"
          onPointerDown={(event) => startGesture(event, selected, 'resize')}
          onClick={(event) => {
            if (event.detail === 0)
              document
                .querySelector<HTMLInputElement>('input[name="width"]')
                ?.focus()
          }}
          style={{
            left: `clamp(0px, calc(${((displayedSelected.x + displayedSelected.width) / board.width) * 100}% - 44px), calc(100% - 44px))`,
            top: `clamp(0px, calc(${((displayedSelected.y + displayedSelected.height) / board.height) * 100}% - 44px), calc(100% - 44px))`,
          }}
        >
          <span aria-hidden="true">↔</span>
        </button>
      )}
    </div>
  )
}
import { useRef, useState, type PointerEvent } from 'react'
