import { pEventIterator } from 'p-event'

/**
 * This is needed because the stream returned by
 * `Hypercore.prototype.createReadStream` is not iterable with `for await`.
 * Normally, Node streams don't need this wrapper.
 * @param {NodeJS.ReadableStream} readable
 * @returns {AsyncIterable<unknown>}
 */
export const readableStreamToAsyncIterable = (readable) =>
  pEventIterator(readable, 'data', { resolutionEvents: ['end'] })
