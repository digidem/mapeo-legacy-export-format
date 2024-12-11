import archiver from 'archiver'
import * as hypercoreCrypto from 'hypercore-crypto'
import hypercore from 'hypercore'
import multifeed from 'multifeed'
import fs from 'node:fs'
import { readdir } from 'node:fs/promises'
import * as path from 'node:path'
import { pEvent } from 'p-event'
import * as hypercoreUtil from './lib/hypercoreUtil.js'
import * as multifeedUtil from './lib/multifeedUtil.js'
import { noop } from './lib/noop.js'
/** @import { Hypercore } from 'hypercore' */
/** @import { HypercoreMetadata, DocumentVersion } from './types.js' */

/**
 * @param {string} inputPath path to `kappa.db` folder
 * @param {string} outputPath path of file to save
 * @returns {Promise<void>}
 */
export async function write(inputPath, outputPath) {
  const output = fs.createWriteStream(outputPath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  let throwArchiveErrorIfExists = noop
  /** @param {Error} err */
  const onArchiveError = (err) => {
    throwArchiveErrorIfExists = () => {
      throw err
    }
    archive.off('warning', onArchiveError)
    archive.off('error', onArchiveError)
  }
  archive.once('warning', onArchiveError)
  archive.once('error', onArchiveError)

  archive.pipe(output)

  throwArchiveErrorIfExists()

  for await (const document of getInputDocuments(inputPath)) {
    throwArchiveErrorIfExists()

    const dirname = `docs/${document.id.slice(0, 2)}/${document.id}`
    const basename = `${document.version || '_'}.json`
    archive.append(JSON.stringify(document), {
      name: `${dirname}/${basename}`,
    })
  }

  const inputMediaPaths = await getInputMediaPaths(inputPath)
  throwArchiveErrorIfExists()
  for (const inputMediaPath of inputMediaPaths) {
    archive.file(inputMediaPath, {
      name: path.relative(inputPath, inputMediaPath),
    })
  }

  const onOutputClosePromise = pEvent(output, 'close')
  archive.finalize()
  throwArchiveErrorIfExists()
  await onOutputClosePromise
}

/**
 * @param {string} inputPath
 * @returns {AsyncGenerator<DocumentVersion>}
 */
async function* getInputDocuments(inputPath) {
  const multi = multifeed(hypercore, inputPath, {
    createIfMissing: false,
    valueEncoding: 'json',
    stats: false,
  })
  await multifeedUtil.ready(multi)

  for (const hypercore of multi.feeds()) {
    await hypercoreUtil.ready(hypercore)
    if (hypercore.length === 0) continue

    const hypercoreMetadata = await getHypercoreMetadata(hypercore)

    for (let i = 0; i < hypercore.length; i++) {
      const document = await hypercoreUtil.get(hypercore, i)
      yield {
        id: parseId(document),
        version: makeVersion(hypercoreMetadata.coreKey, i),
        document,
        hypercoreMetadata: {
          ...hypercoreMetadata,
          blockIndex: i,
        },
      }
    }
  }
}

/**
 * @param {Hypercore} hypercore
 * @returns {Promise<Omit<HypercoreMetadata, 'blockIndex'>>}
 */
async function getHypercoreMetadata(hypercore) {
  await hypercoreUtil.ready(hypercore)

  if (!hypercore.key) {
    throw new Error("Hypercore is missing a key even though it's ready")
  }

  const rootHashesPromise = hypercoreUtil.rootHashes(hypercore, 0)
  const signaturePromise = hypercoreUtil.signature(
    hypercore,
    Math.max(0, hypercore.length - 1)
  )

  return {
    rootHashChecksum: hypercoreCrypto
      .tree(await rootHashesPromise)
      .toString('hex'),
    signature: (await signaturePromise).signature.toString('hex'),
    coreKey: hypercore.key.toString('hex'),
  }
}

/**
 * @param {unknown} document
 * @returns {string}
 */
function parseId(document) {
  if (typeof document !== 'object' || document === null) {
    throw new Error('document is not an object')
  }
  if (!('id' in document) || typeof document.id !== 'string') {
    throw new Error('document.id is not a string')
  }
  return document.id
}

/**
 * @param {string} coreKey
 * @param {number} blockIndex
 * @returns {string}
 */
const makeVersion = (coreKey, blockIndex) => coreKey + '@' + blockIndex

/**
 * @param {string} inputPath
 * @returns {Promise<Array<string>>}
 */
async function getInputMediaPaths(inputPath) {
  const inputMediaRootPath = path.join(inputPath, 'media')
  const inputMediaAllFiles = await readdir(inputMediaRootPath, {
    recursive: true,
    withFileTypes: true,
  })
  const inputMediaFiles = inputMediaAllFiles.filter((dirent) => dirent.isFile())
  return inputMediaFiles.map((dirent) =>
    path.join(dirent.parentPath, dirent.name)
  )
}
