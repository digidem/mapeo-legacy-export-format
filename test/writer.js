//import test from 'node:test'
//import assert from 'node:assert/strict'
import MLEFWriter from '../src/writer.js'

const dbPath = new URL('./fixture/db1/', import.meta.url).pathname
await MLEFWriter(dbPath)
