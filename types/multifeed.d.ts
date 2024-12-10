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

  export default function multifeed(
    hypercore: () => Hypercore,
    storage: string,
    opts?: unknown
  ): Multifeed
}
