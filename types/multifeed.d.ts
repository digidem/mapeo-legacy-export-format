/**
 * This is a subset of the types we actually use, so lots of things are missing.
 */
declare module 'multifeed' {
  import { Hypercore } from 'hypercore'
  import { EventEmitter } from 'node:events'

  export class Multifeed extends EventEmitter {
    ready(cb: () => unknown): void
    close(cb?: (err: unknown) => unknown): void
    feeds(): Hypercore[]
  }

  /**
   * Create a multifeed.
  // TODO: mention that we only use `string` for storage
   *
   * @param storage A `random-access-storage` function, or a string. If a string is given, `random-access-file` is used with that string as the filename.
   * @param opts Passed into new hypercores created, and are the same as hypercore's.
   */
  export default function multifeed(storage: string, opts?: unknown): Multifeed
}
