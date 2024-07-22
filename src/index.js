import fs from 'node:fs'
import Multifeed from "multifeed"
import crypto from 'hypercore-crypto'
import { ZipFile } from 'yazl'

// TODO: how to save attachments? (they live on srcPath/media/{preview, original, thumbnail}

/**
 * @param {String} srcPath path to `kappa.db` folder
 * @param {String} [destPath] path file to save
 */
export async function MLEFWriter(srcPath, destPath){
  const zip = new ZipFile()
  const multi = Multifeed(srcPath, { valueEncoding: 'json'})

  try{
    await multiReady(multi)
    const zipFile = fs.createWriteStream(destPath || "output.mlef")
    zip.outputStream.pipe(zipFile).on("close", function() {
      console.log("done writing zip file");
    });

    for(const core of multi.feeds()){
      const stream = core.createReadStream()
      for await(const doc of stream){
        const version =  doc.version?.split('@')[1]
        // TODO: use better default version than '_'
        // since that first version of doc doesn't haver a version, and second is 0?
        const filename = `${doc.id}@${version || '_'}.json`
        try{
          doc.migrationMetadata = await addMigrationMetadata(core)
          zip.addBuffer(JSON.stringify(doc, null,4), `docs/${filename}`)
        }catch(e){
          console.error('error creating migration metadata', e)
        }
      }
    }
  }catch(e){
    console.error('error reading multifeed', e)
  }
  zip.end()
}

async function addMigrationMetadata(core){
  return {
    rootHashChecksum: crypto.tree(await getRootHash(core)).toString('hex'),
    signature: (await getCoreSignature(core)).toString('hex'),
    coreKey: core.key.toString('hex'),
    blockIndex: core.length
  }
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

function multiReady(multi){
  return new Promise((resolve, reject) => {
    // TODO: ready cb returns two params: a num and a function...
    multi.ready(() => {
      //if(err) return reject(err)
      resolve()
    })
  })
}


