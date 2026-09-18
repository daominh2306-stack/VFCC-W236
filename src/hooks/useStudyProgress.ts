import { useCallback, useEffect, useState } from 'react'
import {
  loadProgress,
  PROGRESS_STORAGE_KEY,
  resetProgress as clearStoredProgress,
  saveProgress,
} from '../lib/progressStorage'

function getInitialProgress(): Set<string> {
  if (typeof window === 'undefined') return new Set()
  return loadProgress(window.localStorage)
}

export function useStudyProgress() {
  const [completedTopicIds, setCompletedTopicIds] = useState(getInitialProgress)

  useEffect(() => {
    const syncProgress = (event: StorageEvent) => {
      if (event.key === PROGRESS_STORAGE_KEY || event.key === null) {
        setCompletedTopicIds(loadProgress(window.localStorage))
      }
    }
    window.addEventListener('storage', syncProgress)
    return () => window.removeEventListener('storage', syncProgress)
  }, [])

  const toggleTopic = useCallback((topicId: string) => {
    setCompletedTopicIds((current) => {
      const next = new Set(current)
      if (next.has(topicId)) next.delete(topicId)
      else next.add(topicId)
      saveProgress(window.localStorage, next)
      return next
    })
  }, [])

  const resetProgress = useCallback(() => {
    clearStoredProgress(window.localStorage)
    setCompletedTopicIds(new Set())
  }, [])

  return { completedTopicIds, toggleTopic, resetProgress }
}
