import { useId, useState } from 'react'
import { inspectorValue } from './inspectorValue'
import type { BoardItem } from './types'
import styles from './ItemInspector.module.css'

type Props = {
  item: BoardItem
  onMove: (x: number, y: number) => void
  onResize: (width: number) => void
}

export function ItemInspector({ item, onMove, onResize }: Props) {
  return (
    <div className={styles.inspector}>
      <p className={styles.hint}>
        Logical board units. Enter or leave a field to apply; Escape to revert.
        Size keeps its proportions and may move the item to fit the board.
      </p>
      {(['x', 'y', 'width'] as const).map((field) => (
        <NumberField
          key={`${item.id}:${field}`}
          name={field}
          label={
            field === 'width' ? 'Width' : `Position ${field.toUpperCase()}`
          }
          value={item[field]}
          normalize={(text) => inspectorValue(item, field, text)}
          onCommit={(value) => {
            if (field === 'width') onResize(value)
            else
              onMove(
                field === 'x' ? value : item.x,
                field === 'y' ? value : item.y,
              )
          }}
        />
      ))}
      <label className={styles.field}>
        Height (units, automatic)
        <input type="number" value={item.height} readOnly step="any" />
      </label>
    </div>
  )
}

function NumberField({
  name,
  label,
  value,
  normalize,
  onCommit,
}: {
  name: string
  label: string
  value: number
  normalize: (text: string) => number | null
  onCommit: (value: number) => void
}) {
  const id = useId()
  const [draft, setDraft] = useState({ source: value, text: String(value) })
  const [message, setMessage] = useState('')
  const [invalid, setInvalid] = useState(false)
  // A committed pointer edit or selection update replaces any stale draft.
  if (draft.source !== value) {
    setDraft({ source: value, text: String(value) })
    setInvalid(false)
    setMessage('')
  }

  function commit() {
    const next = normalize(draft.text)
    if (next === null) {
      setInvalid(true)
      setMessage(
        `Enter a finite number for ${label.toLowerCase()}. The item is unchanged.`,
      )
      return
    }
    setInvalid(false)
    setMessage(
      next !== Number(draft.text)
        ? `${label} adjusted to ${next} units to stay within the allowed bounds.`
        : '',
    )
    setDraft({ source: next, text: String(next) })
    onCommit(next)
  }

  return (
    <div className={styles.field}>
      <label htmlFor={id}>{label} (units)</label>
      <input
        id={id}
        name={name}
        type="number"
        step="any"
        value={draft.text}
        aria-invalid={invalid}
        aria-describedby={`${id}-message`}
        onChange={(event) => {
          setDraft({ source: value, text: event.target.value })
          setInvalid(false)
          setMessage('')
        }}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            commit()
          } else if (event.key === 'Escape') {
            event.preventDefault()
            setDraft({ source: value, text: String(value) })
            setInvalid(false)
            setMessage('')
          }
        }}
      />
      <span className={styles.message} id={`${id}-message`} role="status">
        {message}
      </span>
    </div>
  )
}
