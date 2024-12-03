import assert from 'node:assert/strict'
import test from 'node:test'
import { noop } from '../../src/lib/noop.js'

test('returns undefined', () => {
  assert.equal(noop(), undefined)
})
