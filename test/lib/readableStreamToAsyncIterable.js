import assert from 'node:assert/strict'
import test from 'node:test'
import { Readable } from 'node:stream'
import { readableStreamToAsyncIterable } from '../../src/lib/readableStreamToAsyncIterable.js'

class TestStream extends Readable {
  #count = 0

  /**
   * @param {undefined | string} value
   * @returns {void}
   */
  #push(value) {
    this.push(value ? Buffer.from(value) : null)
    this.#count++
  }

  /**
   * @override
   */
  _read() {
    this.#push(['foo', 'bar', 'baz'][this.#count])
  }

  /**
   * @override
   */
  [Symbol.asyncIterator]() {
    // This is a hack to satisfy TypeScript, which will otherwise complain that
    // this method returns the wrong type.
    if (Date.now()) {
      assert.fail('Wrapper should not call this method')
    }
    return super[Symbol.asyncIterator]()
  }
}

test('returns an async iterable', async () => {
  const result = readableStreamToAsyncIterable(new TestStream())

  const chunks = []
  for await (const chunk of result) chunks.push(chunk)
  assert.deepEqual(
    chunks,
    ['foo', 'bar', 'baz'].map((str) => Buffer.from(str))
  )
})
