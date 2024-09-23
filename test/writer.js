import test from "node:test";
import { join, relative } from 'node:path'
import { json } from 'node:stream/consumers';
import fs from 'node:fs/promises'
import assert from "node:assert/strict";
import yauzl from 'yauzl-promise'
import MLEFWriter from "../src/writer.js";

test("loading and packing a db into a zip", async (t) => {
  const dbName = 'db1'
  const path = new URL(join('./fixture', dbName), import.meta.url).pathname;

  const out = await MLEFWriter(path, path)
  let zip = await yauzl.open(out)
  assert(zip, 'mlef file should exist')

  const outDefaultPath = await MLEFWriter(path)
  const zipDefault = await yauzl.open(outDefaultPath)
  assert(zipDefault, 'mlef file should exist on default path')

  const attachments = (await fs.readdir(join(path, 'media'), {recursive:true, withFileTypes:true}))
  .filter(p => p.isFile())
  .map(p => relative(path,join(p.path, p.name)))

  // TODO: on db there are several cores, just by looking at that fixture I know data is on '1', but that is not robust...
  const docs = (await fs.readFile(join(path, '1', 'data')))
  .toString('utf-8')
  .split('\n')
  .filter(s => s.length !== 0)
  .map((s) => JSON.parse(s))

  const attachmentsInZip = []
  const docsInZip = []

  for await (const entry of zip){
    const path = relative(dbName, entry.filename)
    if(path.includes('media')){
      attachmentsInZip.push(path)
    }
    if(path.includes('docs')){
      const {migrationMetadata, ...doc} = await json(await entry.openReadStream())
      docsInZip.push(doc)
    }
  }

  assert.deepEqual(
    attachmentsInZip,
    attachments,
    'the file tree of attachments zipped matches the original'
  )

  assert.deepEqual(
    docsInZip,
    docs,
    'the docs zipped matches the original'
  )

  t.after(async () => {
    await teardown([out, outDefaultPath])
    zip.close()
    zipDefault.close()
  })
});

async function teardown(toRemove){
  Promise.all(toRemove.map(async (path) => {
    await fs.rm(path)
  }))
}


