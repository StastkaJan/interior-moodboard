import { assets } from '../../data/assets'
import { palettes } from '../../data/palettes'
import { BoardItem } from './BoardItem'
import { clampPosition, clientToBoard } from './geometry'
import type { Board, BoardItem as BoardItemData } from './types'
import styles from './BoardCanvas.module.css'

type BoardCanvasProps = {
  board: Board
  selectedId: string | null
  onSelect: (id: string) => void
  onMove: (id: string, x: number, y: number) => void
}

export function BoardCanvas({
  board,
  selectedId,
  onSelect,
  onMove,
}: BoardCanvasProps) {
  const canvasRef = useRef<HTMLDivElement>(null)
  const gesture = useRef<{
    pointerId: number
    item: BoardItemData
    offset: { x: number; y: number }
  } | null>(null)
  const [preview, setPreview] = useState<BoardItemData | null>(null)

  function startMove(
    event: PointerEvent<HTMLButtonElement>,
    item: BoardItemData,
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
      item,
      offset: { x: point.x - item.x, y: point.y - item.y },
    }
    onSelect(item.id)
    setPreview(item)
  }

  function movePosition(event: PointerEvent) {
    const active = gesture.current
    if (!active || active.pointerId !== event.pointerId || !canvasRef.current)
      return null
    const point = clientToBoard(
      event.clientX,
      event.clientY,
      canvasRef.current.getBoundingClientRect(),
    )
    return point
      ? clampPosition(
          active.item,
          point.x - active.offset.x,
          point.y - active.offset.y,
        )
      : null
  }

  function cancelMove(event: PointerEvent) {
    if (gesture.current?.pointerId !== event.pointerId) return
    gesture.current = null
    setPreview(null)
  }

  return (
    <div
      ref={canvasRef}
      onPointerMove={(event) => {
        const position = movePosition(event)
        if (position && gesture.current)
          setPreview({ ...gesture.current.item, ...position })
      }}
      onPointerUp={(event) => {
        const position = movePosition(event)
        const active = gesture.current
        if (!active || active.pointerId !== event.pointerId) return
        cancelMove(event)
        if (position) onMove(active.item.id, position.x, position.y)
      }}
      onPointerCancel={cancelMove}
      onLostPointerCapture={cancelMove}
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
            onPointerDown={(event) => startMove(event, item)}
            dragging={preview?.id === item.id}
          />
        ) : null
      })}
    </div>
  )
}
import { useRef, useState, type PointerEvent } from 'react'
