import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { join, relative, basename } from 'node:path'
import { json } from 'node:stream/consumers'
import yauzl from 'yauzl-promise'
import mime from 'mime/lite'
import MLEFWriter from '../src/writer.js'

// add testing of links of docs to attachments
// 1. if there's a ref, check that file exists (on the three folders?)
// 2. check that there is no image unreferenced? (not that important)

test('loading and packing a db into a zip', async (t) => {
  const dbName = 'db1'
  const path = new URL(join('./fixture', dbName), import.meta.url).pathname

  const out = await MLEFWriter(path, path)
  let zip = await yauzl.open(out)
  assert(zip, 'mlef file should exist')

  const outDefaultPath = await MLEFWriter(path)
  const zipDefault = await yauzl.open(outDefaultPath)
  assert(zipDefault, 'mlef file should exist on default path')

  const attachments = (
    await fs.readdir(join(path, 'media'), {
      recursive: true,
      withFileTypes: true,
    })
  )
    .filter((p) => p.isFile())
    .map((p) => relative(path, join(p.path, p.name)))

  const dataPromises = (
    await fs.readdir(path, { recursive: true, withFileTypes: true })
  )
    // read all files called 'data', which contain json lines
    .filter((p) => join(p.path, p.name).match(/data/))
    .map(async (p) => await fs.readFile(join(p.path, p.name)))

  const docs = (await Promise.all(dataPromises))
    .toString('utf-8')
    .split('\n')
    .filter((s) => s.length !== 0)
    .map((s) => JSON.parse(s))

  const attachmentsInZip = []
  const docsInZip = []

  for await (const entry of zip) {
    const path = relative(dbName, entry.filename)
    if (path.includes('media')) {
      attachmentsInZip.push(path)
    }
    if (path.includes('docs')) {
      const { migrationMetadata, ...doc } = await json(
        await entry.openReadStream()
      )
      docsInZip.push(doc)
    }
  }

  assert.deepEqual(
    attachmentsInZip,
    attachments,
    'the file tree of attachments zipped matches the original'
  )

  assert.deepEqual(docsInZip, docs, 'the docs zipped matches the original')

  const attachmentsRef = docsInZip.flatMap((doc) => doc.attachments)
  const attachmentsInZipAsRefs = attachmentsInZip
    .filter((attachment) => attachment.match(/original/))
    .map((attachment) => ({
      id: basename(attachment),
      type: mime.getType(attachment),
    }))

  assert.deepEqual(
    new Set(attachmentsRef),
    new Set(attachmentsInZipAsRefs),
    'references to attachments in docs link to images that exist'
  )

  t.after(async () => {
    await teardown([out, outDefaultPath])
    zip.close()
    zipDefault.close()
  })
})

async function teardown(toRemove) {
  Promise.all(
    toRemove.map(async (path) => {
      await fs.rm(path)
    })
  )
}
