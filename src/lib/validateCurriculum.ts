import type {
  Curriculum,
  SourcePriority,
  SourceType,
  WeekNumber,
} from '../types/curriculum'

const WEEK_NUMBERS = new Set<WeekNumber>([2, 3, 6])
const SOURCE_TYPES = new Set<SourceType>([
  'Paper',
  'Book',
  'Guide',
  'Website',
  'Professional standard',
])
const SOURCE_PRIORITIES = new Set<SourcePriority>(['Core', 'Recommended'])

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requireRecord(value: unknown, path: string): Record<string, unknown> {
  if (!isRecord(value)) throw new Error(`${path} must be an object.`)
  return value
}

function requireString(value: unknown, path: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${path} must be a non-empty string.`)
  }
  return value
}

function requireStringArray(value: unknown, path: string): string[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${path} must be a non-empty array.`)
  }
  return value.map((item, index) => requireString(item, `${path}[${index}]`))
}

function requireArray(value: unknown, path: string): unknown[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error(`${path} must be a non-empty array.`)
  }
  return value
}

function assertUnique(ids: string[], label: string): void {
  if (new Set(ids).size !== ids.length) {
    throw new Error(`${label} IDs must be unique.`)
  }
}

/**
 * Rejects malformed curriculum data before the application builds indexes from
 * it. The JSON schema remains the authoring contract; this is the browser-side
 * safety boundary for imported or replaced curriculum files.
 */
export function validateCurriculum(value: unknown): asserts value is Curriculum {
  const root = requireRecord(value, 'curriculum')
  requireString(root.title, 'curriculum.title')
  requireString(root.description, 'curriculum.description')

  const weeks = requireArray(root.weeks, 'curriculum.weeks')
  const sources = Array.isArray(root.sources) ? root.sources : null
  if (!sources) throw new Error('curriculum.sources must be an array.')

  const weekIds: string[] = []
  const topicIds: string[] = []
  const referencedSourceIds: Array<{ sourceId: string; topicId: string }> = []

  weeks.forEach((weekValue, weekIndex) => {
    const path = `curriculum.weeks[${weekIndex}]`
    const week = requireRecord(weekValue, path)
    const weekId = requireString(week.id, `${path}.id`)
    const weekNumber = week.number
    if (typeof weekNumber !== 'number' || !WEEK_NUMBERS.has(weekNumber as WeekNumber)) {
      throw new Error(`${path}.number must be 2, 3, or 6.`)
    }
    requireString(week.label, `${path}.label`)
    requireString(week.title, `${path}.title`)
    requireString(week.summary, `${path}.summary`)
    weekIds.push(weekId)

    requireArray(week.topics, `${path}.topics`).forEach((topicValue, topicIndex) => {
      const topicPath = `${path}.topics[${topicIndex}]`
      const topic = requireRecord(topicValue, topicPath)
      const topicId = requireString(topic.id, `${topicPath}.id`)
      requireString(topic.title, `${topicPath}.title`)
      requireString(topic.summary, `${topicPath}.summary`)
      requireStringArray(topic.learningQuestions, `${topicPath}.learningQuestions`)
      requireStringArray(topic.subtopics, `${topicPath}.subtopics`)
      const sourceIds = requireStringArray(topic.sourceIds, `${topicPath}.sourceIds`)
      assertUnique(sourceIds, `${topicPath}.source`)
      topicIds.push(topicId)
      sourceIds.forEach((sourceId) => referencedSourceIds.push({ sourceId, topicId }))
    })
  })

  assertUnique(weekIds, 'Week')
  assertUnique(topicIds, 'Topic')

  const sourceIds = sources.map((sourceValue, sourceIndex) => {
    const path = `curriculum.sources[${sourceIndex}]`
    const source = requireRecord(sourceValue, path)
    const id = requireString(source.id, `${path}.id`)
    requireString(source.title, `${path}.title`)
    requireString(source.citation, `${path}.citation`)
    if (typeof source.type !== 'string' || !SOURCE_TYPES.has(source.type as SourceType)) {
      throw new Error(`${path}.type is not supported.`)
    }
    if (
      typeof source.priority !== 'string' ||
      !SOURCE_PRIORITIES.has(source.priority as SourcePriority)
    ) {
      throw new Error(`${path}.priority is not supported.`)
    }
    if (source.url !== undefined && typeof source.url !== 'string') {
      throw new Error(`${path}.url must be a string when provided.`)
    }
    if (
      source.verificationNote !== undefined &&
      (typeof source.verificationNote !== 'string' || source.verificationNote.trim() === '')
    ) {
      throw new Error(`${path}.verificationNote must be a non-empty string when provided.`)
    }
    return id
  })

  assertUnique(sourceIds, 'Source')
  const availableSourceIds = new Set(sourceIds)
  const unresolved = referencedSourceIds.filter(
    ({ sourceId }) => !availableSourceIds.has(sourceId),
  )
  if (unresolved.length > 0) {
    const details = unresolved
      .map(({ sourceId, topicId }) => `${topicId} -> ${sourceId}`)
      .join(', ')
    throw new Error(`Curriculum contains unresolved source references: ${details}.`)
  }
}

export function getSafeExternalUrl(value: string | undefined): string | null {
  if (!value) return null
  try {
    const parsed = new URL(value)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
      ? parsed.href
      : null
  } catch {
    return null
  }
}
