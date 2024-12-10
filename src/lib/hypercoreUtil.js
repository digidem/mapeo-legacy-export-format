import { pEvent } from 'p-event'
/** @import { Hypercore } from 'hypercore' */

/**
 * Waits for a Hypercore to be ready.
 *
 * @param {Hypercore} hypercore
 * @returns {Promise<void>}
 */
export const ready = async (hypercore) => {
  const isReady = Boolean(hypercore.key)
  if (isReady) return
  await pEvent(hypercore, 'ready')
}

/**
 * Wraps `Hypercore.prototype.get` in a promise.
 *
 * @param {Hypercore} hypercore
 * @param {number} index
 * @returns {Promise<unknown>}
 */
export const get = async (hypercore, index) =>
  new Promise((resolve, reject) => {
    hypercore.get(index, (err, block) => {
      if (err) {
        reject(err)
      } else {
        resolve(block)
      }
    })
  })

/**
 * Wraps `Hypercore.prototype.rootHashes` in a promise.
 *
 * @param {Hypercore} hypercore
 * @param {number} index
 * @returns {Promise<Array<{
 *   hash: Buffer
 *   index: number
 *   size: number
 * }>>}
 */
export const rootHashes = (hypercore, index) =>
  new Promise((resolve, reject) => {
    hypercore.rootHashes(index, (err, roots) => {
      if (err) {
        return reject(err)
      } else {
        resolve(roots)
      }
    })
  })

/**
 * Wraps `Hypercore.prototype.signature` in a promise.
 *
 * @param {Hypercore} hypercore
 * @param {number} index
 * @returns {Promise<{ index: number, signature: Buffer }>}
 */
export const signature = (hypercore, index) =>
  new Promise((resolve, reject) => {
    hypercore.signature(index, (err, signature) => {
      if (err) {
        reject(err)
      } else {
        resolve(signature)
      }
    })
  })
