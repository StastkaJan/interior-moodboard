import chair from './assets/lounge-chair.svg'
import stone from './assets/travertine.svg'
import styles from './App.module.css'
import { AssetLibrary } from './features/library/AssetLibrary'

function App() {
  return (
    <div className={styles.app}>
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
        <span className={styles.previewBadge}>Concept preview</span>
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
          <AssetLibrary />
        </section>
        <section
          className={styles.boardSection}
          id="board"
          tabIndex={-1}
          aria-labelledby="board-heading"
        >
          <div className={styles.boardHeader}>
            <div>
              <p className={styles.eyebrow}>Room study / 01</p>
              <h1 id="board-heading">Quiet living</h1>
            </div>
            <span className={styles.boardSize}>1000 × 700</span>
          </div>
          <figure
            className={styles.board}
            aria-label="Example interior moodboard"
          >
            <div className={styles.boardNote}>
              <span>A little less.</span>
              <span>A little warmer.</span>
            </div>
            <img
              className={styles.stoneSample}
              src={stone}
              alt="Travertine sample"
            />
            <div
              className={styles.linenSample}
              role="img"
              aria-label="Natural linen sample"
            />
            <img
              className={styles.chairSample}
              src={chair}
              alt="Oak lounge chair"
            />
            <div
              className={styles.colorSamples}
              role="img"
              aria-label="Example colors: chalk, olive, walnut"
            >
              <span />
              <span />
              <span />
            </div>
          </figure>
          <div className={styles.boardFooter}>
            <span>Natural forms. Soft textures. Room to breathe.</span>
            <span>Layout preview · not yet editable</span>
          </div>
        </section>
        <aside
          className={styles.inspector}
          id="details"
          tabIndex={-1}
          aria-labelledby="details-heading"
        >
          <p className={styles.eyebrow}>The details</p>
          <h2 id="details-heading">Room for possibility</h2>
          <div className={styles.inspectorIllustration} aria-hidden="true">
            <span />
            <span />
          </div>
          <p className={styles.muted}>
            Every good room starts with a few things you love.
          </p>
          <p className={styles.footnote}>
            Item position and size controls will appear here when board editing
            is available.
          </p>
          <div className={styles.palettePreview}>
            <h3>Today’s inspiration</h3>
            <p>Warm minimalism</p>
            <div
              className={styles.paletteStrip}
              role="img"
              aria-label="Chalk, oatmeal, olive, and walnut colors"
            >
              <span />
              <span />
              <span />
              <span />
            </div>
            <p className={styles.footnote}>
              Organic materials, grounded tones.
            </p>
          </div>
        </aside>
      </main>
      <footer className={styles.footer}>A space to gather your ideas.</footer>
    </div>
  )
}

export default App
