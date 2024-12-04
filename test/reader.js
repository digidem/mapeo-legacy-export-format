import assert from 'node:assert/strict'
import * as fs from 'node:fs/promises'
import * as path from 'node:path'
import test from 'node:test'
import { temporaryFile } from 'tempy'
import { write, reader } from '../src/index.js'

const FIXTURE_PATH = new URL('./fixture/db1', import.meta.url).pathname
const DOC_WITH_VERSIONS_ID = '74cb70988a17b6e4'
const DOC_WITH_ATTACHMENT_ID = 'd2b6e3d72200c082'

/**
 * @template T
 * @param {Iterable<T> | AsyncIterable<T>} iterable
 * @returns {Promise<Set<T>>}
 */
const setFromAsync = async (iterable) => {
  const set = new Set()
  for await (const item of iterable) set.add(item)
  return set
}

test('can read everything', async (t) => {
  const mlefPath = temporaryFile({ extension: 'mlef' })
  t.after(() => fs.rm(mlefPath, { force: true }))
  await write(FIXTURE_PATH, mlefPath)

  const expectedAttachmentsPromise = Promise.all(
    ['original', 'preview', 'thumbnail'].map(async (variant) => ({
      variant,
      data: await fs.readFile(
        path.join(
          FIXTURE_PATH,
          'media',
          variant,
          '9e',
          '9e657b791646d5c8e1214c4b020a9dd3.jpg'
        )
      ),
    }))
  )

  const r = await reader(mlefPath)
  t.after(() => r.close())

  let hasFoundDocWithVersions = false
  let hasFoundDocWithAttachment = false
  for await (const document of r.documents()) {
    switch (document.id) {
      case DOC_WITH_VERSIONS_ID: {
        assert.equal(document.versions.length, 3, 'expected 3 versions')
        const [doc1, doc2, doc3] = /** @type {any} */ (document.versions)
        assert.equal(doc1.version, null)
        assert.equal(doc1.document.tags.notes, 'Nada')
        assert.equal(
          doc2.version,
          '54aef99c451b09d15f9a3e8f0059fe8d5a97ee2b2f0cb605e3f04153c5723012@0'
        )
        assert.equal(doc2.document.tags.notes, 'Nada de verdas posta')
        assert.equal(
          doc3.version,
          '54aef99c451b09d15f9a3e8f0059fe8d5a97ee2b2f0cb605e3f04153c5723012@4'
        )
        assert.equal(
          doc3.document.tags.notes,
          'Nada de verdas posta, pero esta vez de verdas'
        )
        hasFoundDocWithVersions = true
        break
      }

      case DOC_WITH_ATTACHMENT_ID: {
        assert.equal(document.versions.length, 1, 'expected 1 version')
        const [doc] = /** @type {any} */ (document.versions)
        assert.deepEqual(doc.document.attachments, [
          {
            id: '9e657b791646d5c8e1214c4b020a9dd3.jpg',
            type: 'image/jpeg',
          },
        ])
        assert.deepEqual(
          await setFromAsync(
            r.getMediaById('9e657b791646d5c8e1214c4b020a9dd3.jpg')
          ),
          new Set(await expectedAttachmentsPromise)
        )
        hasFoundDocWithAttachment = true
        break
      }

      default:
        break
    }
  }

  assert(hasFoundDocWithVersions, 'expected to find document with versions')
  assert(hasFoundDocWithAttachment, 'expected to find document with attachment')
})
