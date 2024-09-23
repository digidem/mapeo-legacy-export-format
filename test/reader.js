import MLEFReader from '../src/reader.js'

const path = new URL('./fixture/db1.mlef', import.meta.url).pathname
const reader = await MLEFReader(path)
//console.log(reader.attachments)

