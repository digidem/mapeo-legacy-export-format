import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import { buffer } from 'node:stream/consumers'
import test from 'node:test'
import { temporaryFile } from 'tempy'
import yauzl from 'yauzl-promise'
import { write } from '../src/index.js'

const FIXTURE_PATH = new URL('./fixture/db1', import.meta.url).pathname
const FIXTURE_DOC_ID = '74cb70988a17b6e4'
const FIXTURE_MEDIA_PATHS = [
  path.join(
    FIXTURE_PATH,
    'media',
    'original',
    '4b',
    '4b04270213860542d3fb2d56275fe12f.jpg'
  ),
  path.join(
    FIXTURE_PATH,
    'media',
    'original',
    '9e',
    '9e657b791646d5c8e1214c4b020a9dd3.jpg'
  ),
]

test("doesn't include any duplicate files", async (t) => {
  const outputPath = temporaryFile({ extension: 'mlef' })
  t.after(() => fs.rm(outputPath, { force: true }))

  await write(FIXTURE_PATH, outputPath)

  const zip = await yauzl.open(outputPath)
  t.after(() => zip.close())

  /** @type {Array<string>} */ const filenames = []
  for await (const entry of zip) filenames.push(entry.filename)

  assert.equal(filenames.length, new Set(filenames).size)
})

test('includes all versions of documents', async (t) => {
  const outputPath = temporaryFile({ extension: 'mlef' })
  t.after(() => fs.rm(outputPath, { force: true }))

  await write(FIXTURE_PATH, outputPath)

  const zip = await yauzl.open(outputPath)
  t.after(() => zip.close())

  const docsMatchingFixture = []

  for await (const entry of zip) {
    if (!entry.filename.startsWith('docs/')) continue
    const data = await readYauzlEntry(entry)
    const doc = JSON.parse(data)
    if (doc.id === FIXTURE_DOC_ID) docsMatchingFixture.push(doc)
  }

  assert.equal(docsMatchingFixture.length, 3)

  docsMatchingFixture.sort(versionIdSort)

  assert.equal(docsMatchingFixture[0].document.tags.notes, 'Nada')
  assert.equal(
    docsMatchingFixture[1].document.tags.notes,
    'Nada de verdas posta'
  )
  assert.equal(
    docsMatchingFixture[2].document.tags.notes,
    'Nada de verdas posta, pero esta vez de verdas'
  )
})

test('includes all original media', async (t) => {
  const outputPath = temporaryFile({ extension: 'mlef' })
  t.after(() => fs.rm(outputPath, { force: true }))

  const fixtureMediaPromises = Promise.all(
    FIXTURE_MEDIA_PATHS.map((path) => fs.readFile(path))
  )

  await write(FIXTURE_PATH, outputPath)

  const zip = await yauzl.open(outputPath)
  t.after(() => zip.close())

  let fixtureMediaNotYetFound = await fixtureMediaPromises

  for await (const entry of zip) {
    if (!entry.filename.startsWith('media/')) continue
    const data = await readYauzlEntry(entry)
    fixtureMediaNotYetFound = fixtureMediaNotYetFound.filter(
      (fixtureData) => !fixtureData.equals(data)
    )
  }

  assert.deepEqual(
    fixtureMediaNotYetFound,
    [],
    'all original media should be found in result file'
  )
})

/**
 * @param {yauzl.Entry} entry
 * @returns {Promise<Buffer>}
 */
const readYauzlEntry = async (entry) => buffer(await entry.openReadStream())

/**
 * @param {{ version: null | string }} a
 * @param {{ version: null | string }} b
 * @returns {-1 | 1}
 */
const versionIdSort = (a, b) => {
  if (a.version === null) return -1
  if (b.version === null) return 1
  return a.version.localeCompare(b.version)
}
