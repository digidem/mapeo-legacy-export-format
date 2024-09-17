import fs from 'node:fs'
import Multifeed from "multifeed"
import { ZipFile } from 'yazl'
import {
  multiReady,
  addMigrationMetadata,
} from './utils.js'

// TODO: how to save attachments? (they live on srcPath/media/{preview, original, thumbnail}

/**
 * @param {String} srcPath path to `kappa.db` folder
 * @param {String} [destPath] path file to save
 */
export async function MLEFWriter(srcPath, destPath = 'output.mlef'){
  const zip = new ZipFile()
  const multi = Multifeed(srcPath, { valueEncoding: 'json'})

  try{
    await multiReady(multi)
    const zipFile = fs.createWriteStream(destPath)
    zip.outputStream.pipe(zipFile).on("close", function() {
      console.log(`mlef file writen to ${destPath}`);
    });

    for(const core of multi.feeds()){
      const stream = core.createReadStream()
      for await(const fullDoc of stream){
        const {created_at, timestamp, ...doc } = fullDoc
        const version =  doc.version?.split('@')[1]
        // TODO: use better default version than '_'
        // since that first version of doc doesn't haver a version, and second is 0?
        const filename = `${doc.id}@${version || '_'}.json`
        try{
          doc.migrationMetadata = await addMigrationMetadata(core, {created_at, timestamp})
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
