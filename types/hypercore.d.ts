/**
 * This is a subset of the types we actually use, so lots of things are missing.
 */
declare module 'hypercore' {
  export class Hypercore {
    get key(): Buffer
    get length(): number

    ready(cb: (err: null | Error) => unknown): void

    createReadStream(): AsyncIterable<unknown>

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
}
