import { assets } from '../../data/assets'
import type { Asset } from '../../data/types'
import styles from './AssetLibrary.module.css'

type AssetLibraryProps = {
  onAdd?: (asset: Asset) => void
}

export function AssetLibrary({ onAdd }: AssetLibraryProps) {
  return (
    <>
      <p className={styles.note}>
        {assets.length} pieces to make your own.
        {!onAdd && ' Adding pieces is available in the next slice.'}
      </p>
      <ul className={styles.grid}>
        {assets.map((asset) => (
          <li className={styles.card} key={asset.id}>
            <div className={styles.preview}>
              <img src={asset.imagePath} alt={asset.label} loading="lazy" />
            </div>
            <div className={styles.caption}>
              <span className={styles.category}>{asset.category}</span>
              <span className={styles.label}>{asset.label}</span>
              <button
                type="button"
                aria-label={`Add ${asset.label}`}
                disabled={!onAdd}
                onClick={() => onAdd?.(asset)}
              >
                <span aria-hidden="true">+</span> Add
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
