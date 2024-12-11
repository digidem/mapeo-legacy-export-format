import { buffer } from 'node:stream/consumers'
import * as v from 'valibot'
import yauzl from 'yauzl-promise'
import { DocumentVersionSchema } from './types.js'
/** @import { Document, DocumentVersion } from './types.js' */

/**
 * @internal
 * @typedef {Map<string, yauzl.Entry>} EntriesByFilename
 */

/**
 * @internal
 * @typedef {object} Media
 * @prop {string} variant
 * @prop {Uint8Array} data The media data's bytes. In the future, we might want to make this a stream for efficiency.
 */

/**
 * @param {yauzl.Entry} entry
 * @returns {Promise<Buffer>}
 */
const readYauzlEntry = async (entry) => buffer(await entry.openReadStream())

/**
 * @param {yauzl.Entry} entry
 * @returns {Promise<DocumentVersion>}
 * @throws if the entry cannot be parsed as a document version object
 */
async function readDocumentVersionEntry(entry) {
  const rawData = await readYauzlEntry(entry)
  const json = JSON.parse(rawData.toString('utf8'))
  return v.parse(DocumentVersionSchema, json)
}

/**
 * @param {{ version: null | string }} a
 * @param {{ version: null | string }} b
 * @returns {number}
 */
const versionIdSort = (a, b) => {
  if (a.version === null) return -1
  if (b.version === null) return 1
  return a.version.localeCompare(b.version)
}

class Reader {
  #entriesByFilename
  #close

  /** @type {Map<string, yauzl.Entry[]>} */
  #documentsById = new Map()
  /** @type {Set<string>} */
  #mediaVariants = new Set()

  /**
   * @param {object} options
   * @param {Readonly<EntriesByFilename>} options.entriesByFilename
   * @param {() => unknown} options.close
   */
  constructor({ entriesByFilename, close }) {
    this.#entriesByFilename = entriesByFilename
    this.#close = close

    for (const [filename, entry] of entriesByFilename) {
      const docId = /^docs\/[0-9a-f]{2}\/([^/]+)\//.exec(filename)?.[1]
      if (docId && filename.endsWith('.json')) {
        const entries = this.#documentsById.get(docId) ?? []
        entries.push(entry)
        this.#documentsById.set(docId, entries)
        continue
      }

      const mediaVariant = /^media\/([^/]+)\//.exec(filename)?.[1]
      if (mediaVariant) this.#mediaVariants.add(mediaVariant)
    }
  }

  /**
   * @returns {AsyncIterableIterator<Document>}
   */
  async *documents() {
    for (const [id, entries] of this.#documentsById) {
      const versions = await Promise.all(entries.map(readDocumentVersionEntry))
      versions.sort(versionIdSort)
      yield { id, versions }
    }
  }

  /**
   * @param {string} filename
   * @returns {AsyncIterableIterator<Media>}
   */
  async *getMediaById(filename) {
    for (const variant of this.#mediaVariants) {
      const entry = this.#entriesByFilename.get(
        `media/${variant}/${filename.slice(0, 2)}/${filename}`
      )
      if (!entry) continue
      yield {
        variant,
        data: await readYauzlEntry(entry),
      }
    }
  }

  /**
   * @returns {Promise<void>}
   */
  async close() {
    await this.#close()
  }
}

/**
 * @param {string} inputPath
 * @returns {Promise<Reader>}
 */
export async function reader(inputPath) {
  const zip = await yauzl.open(inputPath)

  /** @type {EntriesByFilename} */
  const entriesByFilename = new Map()
  try {
    for await (const entry of zip) entriesByFilename.set(entry.filename, entry)
  } catch (err) {
    await zip.close()
    throw err
  }

  return new Reader({
    entriesByFilename,
    close: zip.close.bind(zip),
  })
}
