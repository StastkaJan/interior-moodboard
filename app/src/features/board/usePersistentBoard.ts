import { useEffect, useReducer, useRef, useState } from 'react'
import { readBoard, resetBoard, saveBoard } from '../../lib/storage'
import type { WriteResult } from '../../lib/storage'
import { boardReducer, createInitialBoard } from './boardReducer'

export function usePersistentBoard() {
  const [loaded] = useState(() => readBoard())
  const [board, dispatch] = useReducer(boardReducer, loaded, (result) =>
    result.status === 'valid' ? result.board : createInitialBoard(),
  )
  const [protectedData, setProtectedData] = useState(
    loaded.status === 'protected' || loaded.status === 'unavailable',
  )
  const [saveResult, setSaveResult] = useState<
    WriteResult | { status: 'unsaved' }
  >(() =>
    loaded.status === 'valid'
      ? { status: 'saved' }
      : loaded.status === 'absent'
        ? { status: 'unsaved' }
        : { status: loaded.status, message: loaded.message },
  )
  const lastAttempt = useRef(board)

  useEffect(() => {
    if (protectedData || lastAttempt.current === board) return
    lastAttempt.current = board
    const result = saveBoard(board)
    // Report the result of synchronizing committed state with browser storage.
    /* eslint-disable react-hooks/set-state-in-effect */
    setSaveResult(result)
    if (result.status === 'protected') setProtectedData(true)
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [board, protectedData])

  function retrySave() {
    if (protectedData) return
    lastAttempt.current = board
    const result = saveBoard(board)
    setSaveResult(result)
    if (result.status === 'protected') setProtectedData(true)
    return result
  }

  function replaceSavedBoard() {
    const result = resetBoard(board)
    setSaveResult(result)
    if (result.status === 'saved') {
      lastAttempt.current = board
      setProtectedData(false)
    }
    return result
  }

  return {
    board,
    dispatch,
    saveResult,
    protectedData,
    retrySave,
    replaceSavedBoard,
  }
}
