import fs from 'node:fs'
import { readdir, readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'
import Multifeed from "multifeed"
import { ZipFile } from 'yazl'
import {
  multiReady,
  addMigrationMetadata,
} from './utils.js'

/**
 * @param {String} srcPath path to `kappa.db` folder
 * @param {String} [destPath] path file to save
 */
export default async function MLEFWriter(srcPath, destPath = 'output.mlef'){
  const zip = new ZipFile()
  const multi = Multifeed(srcPath, { valueEncoding: 'json'})
  const feedsPath = 'docs'
  const mediaPath = 'media'

  await multiReady(multi)
  const zipFile = fs.createWriteStream(destPath)
  zip.outputStream.pipe(zipFile).on("close", function() {
    console.log(`mlef file writen to ${destPath}`);
  });
  const feeds = writeFeeds(multi)
  const media = writeAttachments(srcPath)
  for await(const {file,filename} of media){
    zip.addBuffer(file, join(mediaPath,filename))
  }
  for await(const {doc, filename} of feeds){
    zip.addBuffer(JSON.stringify(doc, null,4), join(feedsPath,filename))
  }
  zip.end()
}

async function *writeAttachments(srcPath){
  const mediaDir = await readdir(
    join(srcPath,'media'),
    { recursive: true, withFileTypes: true }
  )
  for(const fileOrDir of mediaDir){
    if(fileOrDir.isFile()){
      const file = await readFile(join(fileOrDir.parentPath, fileOrDir.name))
      const filename = join(relative(srcPath,fileOrDir.parentPath),fileOrDir.name)
      yield { filename, file }
    }
  }
}

async function *writeFeeds(multi){
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
        yield { doc,filename }
      }catch(e){
        console.error('error creating migration metadata', e)
      }
    }
  }
}
