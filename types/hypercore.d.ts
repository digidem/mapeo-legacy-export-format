/**
 * This is a subset of the types we actually use, so lots of things are missing.
 */
declare module 'hypercore' {
  type SignatureCallback = (
    err: null | Error,
    { index: number, signature: Buffer }
  ) => unknown

  export class Hypercore {
    get key(): Buffer
    get length(): number

    ready(cb: (err: null | Error) => unknown): void

    createReadStream(): AsyncIterable<unknown>

    signature(cb: SignatureCallback): void
    signature(index: number, cb: SignatureCallback): void

    rootHashes(
      index: number,
      cb: (
        err: null | Error,
        roots: Array<{ hash: Buffer; index: number; size: number }>
      ) => unknown
    ): void
  }
}
