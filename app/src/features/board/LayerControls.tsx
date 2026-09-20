import type { Board } from './types'
import styles from './LayerControls.module.css'

type Props = {
  board: Board
  selectedId: string
  onReorder: (direction: 'forward' | 'backward') => void
}

export function LayerControls({ board, selectedId, onReorder }: Props) {
  const index = board.items.findIndex((item) => item.id === selectedId)
  return (
    <fieldset className={styles.controls}>
      <legend>Stacking order</legend>
      <button
        type="button"
        disabled={index <= 0}
        onClick={() => onReorder('backward')}
      >
        Send backward
      </button>
      <button
        type="button"
        disabled={index < 0 || index === board.items.length - 1}
        onClick={() => onReorder('forward')}
      >
        Bring forward
      </button>
      <p role="status">
        Layer {index + 1} of {board.items.length} (back to front)
      </p>
    </fieldset>
  )
}
