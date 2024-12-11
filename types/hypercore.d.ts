/**
 * This is a subset of the types we actually use, so lots of things are missing.
 */
declare module 'hypercore' {
  import { EventEmitter } from 'node:events'

  export class Hypercore extends EventEmitter {
    get key(): null | Buffer
    get length(): number

    get(index: number, cb: (err: null | Error, block: unknown) => unknown): void

    signature(
      index: number,
      cb: (
        err: null | Error,
        signature: { index: number; signature: Buffer }
      ) => unknown
    ): void

    rootHashes(
      index: number,
      cb: (
        err: null | Error,
        roots: Array<{ hash: Buffer; index: number; size: number }>
      ) => unknown
    ): void
  }

  export default function hypercore(...args: unknown[]): Hypercore
}
