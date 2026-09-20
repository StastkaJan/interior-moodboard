import type { usePersistentBoard } from './usePersistentBoard'
import styles from './SaveStatus.module.css'

type SaveStatusProps = Pick<
  ReturnType<typeof usePersistentBoard>,
  'saveResult' | 'protectedData' | 'retrySave' | 'replaceSavedBoard'
>

export function SaveStatus({
  saveResult,
  protectedData,
  retrySave,
  replaceSavedBoard,
}: SaveStatusProps) {
  return (
    <div className={styles.status}>
      <p role="status">
        {saveResult.status === 'saved'
          ? 'Saved on this device.'
          : saveResult.status === 'unsaved'
            ? 'Changes will save on this device.'
            : saveResult.message}
      </p>
      {protectedData ? (
        <>
          <p>
            You are editing a temporary board. Automatic saving is paused to
            protect existing data. Replacing it saves this board and discards
            the previous saved data.
          </p>
          <button
            type="button"
            onClick={() => {
              if (
                window.confirm(
                  'Replace the previous saved data with this temporary board? The previous data will be permanently discarded. Cancel keeps it unchanged.',
                )
              )
                replaceSavedBoard()
            }}
          >
            Replace saved data with this board
          </button>
        </>
      ) : saveResult.status === 'unavailable' ||
        saveResult.status === 'invalid' ? (
        <button type="button" onClick={retrySave}>
          Retry saving
        </button>
      ) : null}
    </div>
  )
}
