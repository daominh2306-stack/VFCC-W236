import { describe, expect, it } from 'vitest'
import {
  loadProgress,
  PROGRESS_STORAGE_KEY,
  resetProgress,
  saveProgress,
} from '../src/lib/progressStorage'

class MemoryStorage implements Storage {
  private values = new Map<string, string>()

  get length() {
    return this.values.size
  }

  clear() {
    this.values.clear()
  }

  getItem(key: string) {
    return this.values.get(key) ?? null
  }

  key(index: number) {
    return [...this.values.keys()][index] ?? null
  }

  removeItem(key: string) {
    this.values.delete(key)
  }

  setItem(key: string, value: string) {
    this.values.set(key, value)
  }
}

describe('study progress storage', () => {
  it('uses the dedicated public storage key', () => {
    expect(PROGRESS_STORAGE_KEY).toBe('ma_theory_completed_topics')
  })

  it('saves and restores completed topic IDs', () => {
    const storage = new MemoryStorage()
    saveProgress(storage, new Set(['w3-discount-rate', 'w2-working-capital']))

    expect(loadProgress(storage)).toEqual(
      new Set(['w2-working-capital', 'w3-discount-rate']),
    )
  })

  it('resets persisted progress', () => {
    const storage = new MemoryStorage()
    saveProgress(storage, new Set(['w6-qa-defence']))
    resetProgress(storage)

    expect(storage.getItem(PROGRESS_STORAGE_KEY)).toBeNull()
    expect(loadProgress(storage)).toEqual(new Set())
  })

  it('recovers safely from invalid stored data', () => {
    const storage = new MemoryStorage()
    storage.setItem(PROGRESS_STORAGE_KEY, '{not valid json')
    expect(loadProgress(storage)).toEqual(new Set())
  })
})
