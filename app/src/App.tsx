import { useRef, useState } from 'react'
import { assets } from './data/assets'
import type { Asset } from './data/types'
import { BoardCanvas } from './features/board/BoardCanvas'
import { BoardSettings } from './features/board/BoardSettings'
import { ItemInspector } from './features/board/ItemInspector'
import { LayerControls } from './features/board/LayerControls'
import { keyboardMove } from './features/board/keyboardMove'
import { SaveStatus } from './features/board/SaveStatus'
import { usePersistentBoard } from './features/board/usePersistentBoard'
import styles from './App.module.css'
import { AssetLibrary } from './features/library/AssetLibrary'

function App() {
  const {
    board,
    dispatch,
    saveResult,
    protectedData,
    retrySave,
    replaceSavedBoard,
  } = usePersistentBoard()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const boardSectionRef = useRef<HTMLElement>(null)
  const selectedItem = board.items.find((item) => item.id === selectedId)
  const selectedAsset = assets.find(
    (asset) => asset.id === selectedItem?.assetId,
  )

  function addItem(asset: Asset) {
    const id = crypto.randomUUID()
    dispatch({ type: 'add', id, asset })
    setSelectedId(id)
  }

  function removeSelectedItem() {
    if (!selectedItem) return
    dispatch({ type: 'remove', id: selectedItem.id })
    setSelectedId(null)
    boardSectionRef.current?.focus()
  }
  return (
    <div
      className={styles.app}
      onKeyDown={(event) => {
        if (
          !selectedItem ||
          event.defaultPrevented ||
          (event.target instanceof Element &&
            event.target.closest('input, textarea, select, [contenteditable]'))
        )
          return
        const position = keyboardMove(selectedItem, event.nativeEvent)
        if (!position) return
        event.preventDefault()
        dispatch({ type: 'move', id: selectedItem.id, ...position })
      }}
    >
      <a className={styles.skipLink} href="#board">
        Skip to board
      </a>
      <header className={styles.header}>
        <a
          className={styles.brand}
          href="#board"
          aria-label="Interior Moodboard, board"
        >
          <span className={styles.brandMark} aria-hidden="true">
            im.
          </span>
          <span>
            interior
            <br />
            moodboard
          </span>
        </a>
        <nav className={styles.navigation} aria-label="Workspace sections">
          <a href="#board">Board</a>
          <a href="#library">Library</a>
          <a href="#details">Details</a>
        </nav>
        <span className={styles.previewBadge}>Your workspace</span>
      </header>
      <main className={styles.workspace}>
        <section
          className={styles.library}
          id="library"
          tabIndex={-1}
          aria-labelledby="library-heading"
        >
          <p className={styles.eyebrow}>The collection</p>
          <h2 id="library-heading">Objects &amp; materials</h2>
          <p className={styles.muted}>
            Considered pieces for a space that feels like you.
          </p>
          <AssetLibrary onAdd={addItem} />
        </section>
        <section
          className={styles.boardSection}
          id="board"
          ref={boardSectionRef}
          tabIndex={-1}
          aria-labelledby="board-heading"
          aria-describedby="keyboard-help"
        >
          <div className={styles.boardHeader}>
            <div>
              <p className={styles.eyebrow}>Room study / 01</p>
              <h1 id="board-heading">{board.title}</h1>
            </div>
            <span className={styles.boardSize}>
              {board.width} &times; {board.height}
            </span>
          </div>
          <BoardCanvas
            board={board}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={(id, x, y) => dispatch({ type: 'move', id, x, y })}
            onResize={(id, width) => dispatch({ type: 'resize', id, width })}
          />
          <p className={styles.muted} id="keyboard-help">
            Select a piece, then use arrow keys to move by 1 unit; hold Shift
            for 10 units. Shortcuts pause while editing a field.
          </p>
          <p className={styles.muted} role="status" aria-live="polite">
            {selectedItem
              ? `${selectedAsset?.label} selected. Position ${Math.round(selectedItem.x)}, ${Math.round(selectedItem.y)}; width ${Math.round(selectedItem.width)} units.`
              : `${board.items.length} ${board.items.length === 1 ? 'piece' : 'pieces'} on the board. No item selected.`}
          </p>
          <div className={styles.boardFooter}>
            <span>Natural forms. Soft textures. Room to breathe.</span>
            <span>
              {board.items.length} {board.items.length === 1 ? 'piece' : 'pieces'}
            </span>
          </div>
          <SaveStatus
            saveResult={saveResult}
            protectedData={protectedData}
            retrySave={() => {
              const result = retrySave()
              if (result?.status === 'saved') boardSectionRef.current?.focus()
              return result
            }}
            replaceSavedBoard={() => {
              const result = replaceSavedBoard()
              if (result.status === 'saved') boardSectionRef.current?.focus()
              return result
            }}
          />
        </section>
        <aside
          className={styles.inspector}
          id="details"
          tabIndex={-1}
          aria-labelledby="details-heading"
        >
          <p className={styles.eyebrow}>The details</p>
          <h2 id="details-heading">
            {selectedAsset?.label ?? 'Room for possibility'}
          </h2>
          <label className={styles.itemPicker}>
            Selected item
            <select
              value={selectedItem?.id ?? ''}
              onChange={(event) => setSelectedId(event.target.value || null)}
            >
              <option value="">Choose a piece</option>
              {board.items.map((item, index) => (
                <option key={item.id} value={item.id}>
                  {index + 1}.{' '}
                  {assets.find((asset) => asset.id === item.assetId)?.label}
                </option>
              ))}
            </select>
          </label>
          {selectedItem ? (
            <>
              <ItemInspector
                item={selectedItem}
                onMove={(x, y) =>
                  dispatch({ type: 'move', id: selectedItem.id, x, y })
                }
                onResize={(width) =>
                  dispatch({ type: 'resize', id: selectedItem.id, width })
                }
              />
              <LayerControls
                board={board}
                selectedId={selectedItem.id}
                onReorder={(direction) =>
                  dispatch({ type: 'reorder', id: selectedItem.id, direction })
                }
              />
              <button
                className={styles.removeButton}
                type="button"
                onClick={removeSelectedItem}
              >
                Remove selected item
              </button>
            </>
          ) : (
            <p className={styles.muted}>
              Choose a piece on the board, or add something you love.
            </p>
          )}
          <BoardSettings board={board} dispatch={dispatch} />
        </aside>
      </main>
      <footer className={styles.footer}>A space to gather your ideas.</footer>
    </div>
  )
}

export default App
