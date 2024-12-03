/** @import { Multifeed } from 'multifeed' */

/**
 * @param {Multifeed} multifeed
 * @returns {Promise<void>}
 */
export const ready = (multifeed) =>
  new Promise((resolve, reject) => {
    multifeed.once('error', reject)

    multifeed.ready(() => {
      multifeed.off('error', reject)
      resolve()
    })
  })
