import type { Asset } from '../../data/types'
import type { Board, BoardItem as BoardItemData } from './types'
import styles from './BoardCanvas.module.css'

type BoardItemProps = {
  item: BoardItemData
  asset: Asset
  board: Board
  index: number
  selected: boolean
  onSelect: (id: string) => void
}

export function BoardItem({
  item,
  asset,
  board,
  index,
  selected,
  onSelect,
}: BoardItemProps) {
  return (
    <button
      type="button"
      className={styles.item}
      aria-label={`Select ${asset.label}, item ${index + 1}`}
      aria-pressed={selected}
      onClick={() => onSelect(item.id)}
      style={{
        left: `${(item.x / board.width) * 100}%`,
        top: `${(item.y / board.height) * 100}%`,
        width: `${(item.width / board.width) * 100}%`,
        height: `${(item.height / board.height) * 100}%`,
      }}
    >
      <img src={asset.imagePath} alt="" draggable={false} />
    </button>
  )
}
