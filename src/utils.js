import crypto from 'hypercore-crypto'

/**
 * @param {typeof import('../types/multifeed.d.ts')} core
 * @param {Record<string,unknown>} doc
 */
export async function addMigrationMetadata(core, doc) {
  return {
    rootHashChecksum: crypto.tree(await getRootHash(core)).toString('hex'),
    signature: (await getCoreSignature(core)).toString('hex'),
    coreKey: core.key.toString('hex'),
    blockIndex: core.length,
    created_at: doc.created_at,
    timestamp: doc.timestamp,
  }
}

/**
 * @param {typeof import('multifeed')} multi
 * @returns {Promise<void>}
 */
export function multiReady(multi) {
  return new Promise((resolve) => {
    // TODO: ready cb returns two params: a num and a function...
    multi.ready(() => {
      //if(err) return reject(err)
      resolve()
    })
  })
}

/**
 * @param {import('../types/multifeed.d.ts')} core
 * @returns {Promise<Buffer>}
 */
function getCoreSignature(core) {
  return new Promise((resolve, reject) => {
    core.signature(
      /** @param {Error} err
       *  @param {{signature: Buffer}} sig
       */
      (err, sig) => {
        if (err) return reject(err)
        resolve(sig.signature)
      }
    )
  })
}

/**
 * @param {typeof import('../types/multifeed.d.ts')} core
 * @returns {Promise<Buffer>}
 */
function getRootHash(core) {
  return new Promise((resolve, reject) => {
    core.rootHashes(
      0,
      /**
       * @param {Error} err
       * @param {Buffer} roots
       */
      (err, roots) => {
        if (err) return reject(err)
        resolve(roots)
      }
    )
  })
}
