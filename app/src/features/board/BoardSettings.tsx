import { useState } from 'react'
import { palettes } from '../../data/palettes'
import { MAX_BOARD_TITLE_LENGTH, type BoardAction } from './boardReducer'
import type { Board } from './types'
import styles from './BoardSettings.module.css'

type BoardSettingsProps = {
  board: Board
  dispatch: (action: BoardAction) => void
}

export function BoardSettings({ board, dispatch }: BoardSettingsProps) {
  const [draftTitle, setDraftTitle] = useState<string | null>(null)

  function commitTitle() {
    if (draftTitle !== null) dispatch({ type: 'rename', title: draftTitle })
    setDraftTitle(null)
  }

  return (
    <section className={styles.settings} aria-label="Board settings">
      <label className={styles.title} htmlFor="board-title">
        Board title
      </label>
      <input
        id="board-title"
        value={draftTitle ?? board.title}
        maxLength={MAX_BOARD_TITLE_LENGTH}
        aria-describedby="title-help"
        onChange={(event) => setDraftTitle(event.target.value)}
        onBlur={commitTitle}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
            event.preventDefault()
            commitTitle()
          }
        }}
      />
      <p id="title-help" className={styles.hint}>
        Up to 80 characters. Press Enter or leave the field to apply. An empty
        title restores “My room concept”.
      </p>
      <fieldset className={styles.palettes}>
        <legend>Board palette</legend>
        {palettes.map((palette) => (
          <label key={palette.id} className={styles.palette}>
            <input
              type="radio"
              name="board-palette"
              value={palette.id}
              checked={board.paletteId === palette.id}
              onChange={() =>
                dispatch({ type: 'palette', paletteId: palette.id })
              }
            />
            <span
              className={styles.swatch}
              style={{ backgroundColor: palette.background }}
              aria-hidden="true"
            />
            {palette.label}
          </label>
        ))}
      </fieldset>
    </section>
  )
}
