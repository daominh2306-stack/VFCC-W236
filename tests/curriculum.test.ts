import Ajv2020 from 'ajv/dist/2020.js'
import { describe, expect, it } from 'vitest'
import schema from '../data/curriculum.schema.json'
import { curriculum } from '../src/data/curriculum'

describe('curriculum data contract', () => {
  it('matches the curriculum JSON schema', () => {
    const ajv = new Ajv2020({ allErrors: true })
    ajv.addFormat('uri', (value: string) => {
      try {
        return Boolean(new URL(value))
      } catch {
        return false
      }
    })
    const validate = ajv.compile(schema)
    const valid = validate(curriculum)

    expect(validate.errors).toEqual(null)
    expect(valid).toBe(true)
  })

  it('uses unique topic IDs and unique source IDs', () => {
    const topicIds = curriculum.weeks.flatMap((week) =>
      week.topics.map((topic) => topic.id),
    )
    const sourceIds = curriculum.sources.map((source) => source.id)

    expect(new Set(topicIds).size).toBe(topicIds.length)
    expect(new Set(sourceIds).size).toBe(sourceIds.length)
  })

  it('resolves every sourceId used by every topic', () => {
    const sourceIds = new Set(curriculum.sources.map((source) => source.id))
    const unresolved = curriculum.weeks.flatMap((week) =>
      week.topics.flatMap((topic) =>
        topic.sourceIds
          .filter((sourceId) => !sourceIds.has(sourceId))
          .map((sourceId) => ({ topicId: topic.id, sourceId })),
      ),
    )

    expect(unresolved).toEqual([])
  })
})
