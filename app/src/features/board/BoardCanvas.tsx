import { assets } from '../../data/assets'
import { BoardItem } from './BoardItem'
import type { Board } from './types'
import styles from './BoardCanvas.module.css'

type BoardCanvasProps = {
  board: Board
  selectedId: string | null
  onSelect: (id: string) => void
}

export function BoardCanvas({ board, selectedId, onSelect }: BoardCanvasProps) {
  return (
    <div className={styles.canvas} role="group" aria-label="Moodboard items">
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
            item={item}
            asset={asset}
            board={board}
            index={index}
            selected={selectedId === item.id}
            onSelect={onSelect}
          />
        ) : null
      })}
    </div>
  )
}
