declare module 'hypercore-crypto' {
  export function discoveryKey(publicKey: Buffer): Buffer

  export function tree(
    roots: ArrayLike<{
      hash: Buffer
      index: number
      size: number
    }>,
    out?: Buffer
  ): Buffer
}
