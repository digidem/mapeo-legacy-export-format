import yauzl from 'yauzl-promise'
import { json, buffer } from 'node:stream/consumers'
import { basename, parse } from 'node:path'

export default async function MLEFReader(path){
  const zip = await yauzl.open(path)
  const docs = []
  const attachments = {}
  const typeOfAttachments = ['original', 'preview', 'thumbnail']
  for await(const entry of zip){
    if(entry.filename.match(/docs/)){
      docs.push(await json(await entry.openReadStream()))
    }else if(entry.filename.match(/media/)){
      const name = parse(entry.filename).name
      if(!(name in attachments)){
        attachments[name] = {filename: basename(entry.filename)}
      }
      for(const possibleType of typeOfAttachments){
        const [type] = entry.filename.match(possibleType) || []
        if(type){
          attachments[name][type] = await buffer(await entry.openReadStream())
        }
      }
    }
  }
  return {docs, attachments: Object.values(attachments)}
}
