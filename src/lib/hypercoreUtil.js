/** @import { Hypercore } from 'hypercore' */

/**
 * Wraps `Hypercore.prototype.ready` in a promise.
 *
 * @param {Hypercore} hypercore
 * @returns {Promise<void>}
 */
export const ready = (hypercore) =>
  new Promise((resolve, reject) => {
    hypercore.ready((err) => {
      if (err) {
        reject(err)
      } else {
        resolve()
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
 * @returns {Promise<Buffer>}
 */
export const signature = (hypercore, index) =>
  new Promise((resolve, reject) => {
    hypercore.signature(index, (err, sig) => {
      if (err) {
        reject(err)
      } else {
        // TODO: This wrapper does a little too much here
        resolve(sig.signature)
      }
    })
  })
