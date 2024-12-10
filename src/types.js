import * as v from 'valibot'

/**
 * @typedef {object} HypercoreMetadata
 * @prop {string} rootHashChecksum
 * @prop {string} signature
 * @prop {string} coreKey
 * @prop {number} blockIndex
 */

/**
 * @typedef {object} DocumentVersion
 * @prop {string} id
 * @prop {string} version
 * @prop {unknown} document
 * @prop {HypercoreMetadata} hypercoreMetadata
 */

export const DocumentVersionSchema = v.object({
  id: v.pipe(v.string(), v.minLength(1)),
  version: v.string(),
  document: v.record(v.string(), v.unknown()),
  hypercoreMetadata: v.object({
    rootHashChecksum: v.string(),
    signature: v.string(),
    coreKey: v.string(),
    blockIndex: v.number(),
  }),
})
