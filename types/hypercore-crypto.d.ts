declare module 'hypercore-crypto' {
  export function discoveryKey(publicKey: Buffer | Uint8Array): Buffer
  export function tree(Buffer)
}
