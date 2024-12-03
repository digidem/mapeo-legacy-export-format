/** @import { Multifeed } from 'multifeed' */

/**
 * @param {Multifeed} multifeed
 * @returns {Promise<void>}
 */
export const ready = (multifeed) =>
  new Promise((resolve, reject) => {
    // TODO: Clean up these listeners

    multifeed.once('error', (err) => {
      reject(err)
    })

    multifeed.ready(() => {
      resolve()
    })
  })
