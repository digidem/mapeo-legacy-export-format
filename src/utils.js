import crypto from 'hypercore-crypto'

export async function addMigrationMetadata(core){
  return {
    rootHashChecksum: crypto.tree(await getRootHash(core)).toString('hex'),
    signature: (await getCoreSignature(core)).toString('hex'),
    coreKey: core.key.toString('hex'),
    blockIndex: core.length
  }
}

export function multiReady(multi){
  return new Promise((resolve, reject) => {
    // TODO: ready cb returns two params: a num and a function...
    multi.ready(() => {
      //if(err) return reject(err)
      resolve()
    })
  })
}

/**
 * @returns {Promise<Buffer>}
*/
function getCoreSignature(core){
  return new Promise((resolve,reject) => {
    core.signature((err,sig) => {
      if(err) return reject(err)
      resolve(sig.signature)
    })
  })
}

/**
 * @returns {Promise<Buffer>}
*/
function getRootHash(core){
  return new Promise((resolve,reject) => {
    core.rootHashes(0, (err,roots) => {
      if(err) return reject(err)
      resolve(roots)
    })
  })
}


