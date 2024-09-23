import MLEFReader from '../src/reader.js'

const path = new URL('./fixture/db1.mlef', import.meta.url).pathname
reader = MLEFReader(path)

for await(const {attachments, docs} of reader){
}

