export const PROGRESS_STORAGE_KEY = 'ma_theory_completed_topics'

export function loadProgress(storage: Storage): Set<string> {
  try {
    const saved = storage.getItem(PROGRESS_STORAGE_KEY)
    if (!saved) return new Set()
    const parsed: unknown = JSON.parse(saved)
    if (!Array.isArray(parsed)) return new Set()
    return new Set(parsed.filter((value): value is string => typeof value === 'string'))
  } catch {
    return new Set()
  }
}

export function saveProgress(
  storage: Storage,
  completedTopicIds: ReadonlySet<string>,
): void {
  try {
    storage.setItem(
      PROGRESS_STORAGE_KEY,
      JSON.stringify([...completedTopicIds].sort()),
    )
  } catch {
    // Storage may be unavailable in private browsing or under a strict quota.
    // The in-memory study session should continue to work in either case.
  }
}

export function resetProgress(storage: Storage): void {
  try {
    storage.removeItem(PROGRESS_STORAGE_KEY)
  } catch {
    // Match saveProgress: storage failures must not break the interface.
  }
}
