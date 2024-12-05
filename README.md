# Mapeo Legacy Export Format

The Mapeo Legacy Export Format is a format for reading and writing legacy Mapeo data. It can be used to export data from Mapeo to be transformed for import into CoMapeo, or for some other purpose.

## The file format

`.mlef` files are just [ZIP files](<https://en.wikipedia.org/wiki/ZIP_(file_format)>) with a different extension.

They contain two folders:

- `docs/`, which contains all documents and their versions.
- `media/`, which contains all media, such as photos.

Documents and media are identified by a hex-encoded ID, such as `74cb70988a17b6e4`. They're nested in prefixed folders to help avoid extremely large directories. For example, `74cb70988a17b6e4` is placed in `74/74cb70988a17b6e4/`.

All of a document's versions are in the same folder. The first version will be called `_.json` and subsequent versions will be named with their version number.

Here's an example directory structure:

```
docs/
├─ d2/
│  └─ d2b6e3d72200c082/
│     └─ _.json
└─ 74/
   └─ 74cb70988a17b6e4/
      ├─ _.json
      ├─ 54aef99c451b09d15f9a3e8f0059fe8d5a97ee2b2f0cb605e3f04153c5723012@0.json
      └─ 54aef99c451b09d15f9a3e8f0059fe8d5a97ee2b2f0cb605e3f04153c5723012@4.json

media/
├─ original/
│  ├─ 4b/
│  │  └─ 4b04270213860542d3fb2d56275fe12f.jpg
│  └─ 9e/
│     └─ 9e657b791646d5c8e1214c4b020a9dd3.jpg
├─ preview/
│  ├─ 4b/
│  │  └─ 4b04270213860542d3fb2d56275fe12f.jpg
│  └─ 9e/
│     └─ 9e657b791646d5c8e1214c4b020a9dd3.jpg
└─ thumbnail/
   ├─ 4b/
   │  └─ 4b04270213860542d3fb2d56275fe12f.jpg
   └─ 9e/
      └─ 9e657b791646d5c8e1214c4b020a9dd3.jpg
```

## Writing data

The `write` function takes a `kappa.db` folder as input, and the path of the output MLEF file. For example:

```javascript
import { write } from 'mapeo-legacy-export-format'

const input = '/path/to/kappa.db'
const output = '/path/to/exported.mlef'
await write(input, output)
```

Refer to [the tests](https://github.com/digidem/mapeo-legacy-export-format/blob/main/test/writer.js) for a detailed example.

## Reading data

The `reader` function returns a Promise that resolves with a `Reader` instance. This instance lets you iterate over all documents and their versions. It also lets you fetch media. It should be closed when you're finished.

```javascript
import { reader } from 'mapeo-legacy-export-format'

const mlefPath = '/path/to/exported.mlef'

const r = await reader(mlefPath)

for await (const document of r.documents()) {
  console.log('Document ID:', document.id)
  for (const documentVersion of document.versions) {
    console.log(
      'Document version (null if first version):',
      documentVersion.version
    )
    console.log('Raw document:', documentVersion.document)
    console.log('Hypercore metadata:', documentVersion.hypercoreMetadata)
  }
}

for await (const mediaVariant of r.getMediaById('abc.jpg')) {
  console.log(
    'Media variant (such as "original" or "preview"):',
    mediaVariant.variant
  )
  console.log('Bytes:', mediaVariant.data)
}

await r.close()
```

Refer to [the tests](https://github.com/digidem/mapeo-legacy-export-format/blob/main/test/reader.js) for a detailed example.
