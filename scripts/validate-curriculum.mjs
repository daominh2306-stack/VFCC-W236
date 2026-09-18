import fs from 'node:fs'
import process from 'node:process'
import Ajv2020 from 'ajv/dist/2020.js'

const curriculum = JSON.parse(fs.readFileSync(new URL('../data/curriculum.json', import.meta.url), 'utf8'))
const schema = JSON.parse(fs.readFileSync(new URL('../data/curriculum.schema.json', import.meta.url), 'utf8'))
const ajv = new Ajv2020({ allErrors: true })

ajv.addFormat('uri', (value) => {
  try {
    return Boolean(new URL(value))
  } catch {
    return false
  }
})

const validate = ajv.compile(schema)
const schemaValid = validate(curriculum)
const topicIds = curriculum.weeks.flatMap((week) => week.topics.map((topic) => topic.id))
const sourceIds = curriculum.sources.map((source) => source.id)
const sourceIdSet = new Set(sourceIds)
const unresolvedSourceIds = curriculum.weeks.flatMap((week) =>
  week.topics.flatMap((topic) =>
    topic.sourceIds
      .filter((sourceId) => !sourceIdSet.has(sourceId))
      .map((sourceId) => `${topic.id}: ${sourceId}`),
  ),
)

const errors = []
if (!schemaValid) errors.push(...(validate.errors ?? []).map((error) => `${error.instancePath || '/'} ${error.message}`))
if (new Set(topicIds).size !== topicIds.length) errors.push('Topic IDs must be unique.')
if (new Set(sourceIds).size !== sourceIds.length) errors.push('Source IDs must be unique.')
if (unresolvedSourceIds.length) errors.push(`Unresolved source IDs: ${unresolvedSourceIds.join(', ')}`)

if (errors.length) {
  console.error('Curriculum validation failed:')
  for (const error of errors) console.error(`- ${error}`)
  process.exit(1)
}

console.log(`Curriculum valid: ${curriculum.weeks.length} weeks, ${topicIds.length} topics, ${sourceIds.length} sources.`)
