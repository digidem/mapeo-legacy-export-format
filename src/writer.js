import fs from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import crypto from "hypercore-crypto";
import Multifeed from "multifeed";
import { ZipFile } from "yazl";

/**
 * @param {String} srcPath path to `kappa.db` folder
 * @param {String} [destPath] path file to save
 */
export default async function MLEFWriter(srcPath, destPath = "output.mlef") {
  const zip = new ZipFile();
  const multi = Multifeed(srcPath, { valueEncoding: "json" });
  const feedsPath = "docs";
  const mediaPath = "media";

  await multiReady(multi);
  const zipFile = fs.createWriteStream(destPath);
  zip.outputStream.pipe(zipFile).on("close", function () {
    console.log(`mlef file writen to ${destPath}`);
  });
  const feeds = writeFeeds(multi);
  const media = writeAttachments(srcPath);
  for await (const { file, filename } of media) {
    zip.addBuffer(file, join(mediaPath, filename));
  }
  for await (const { doc, filename } of feeds) {
    zip.addBuffer(JSON.stringify(doc, null, 4), join(feedsPath, filename));
  }
  zip.end();
}

async function* writeAttachments(srcPath) {
  const mediaDir = await readdir(join(srcPath, "media"), {
    recursive: true,
    withFileTypes: true,
  });
  for (const fileOrDir of mediaDir) {
    if (fileOrDir.isFile()) {
      const file = await readFile(join(fileOrDir.parentPath, fileOrDir.name));
      const filename = join(
        relative(srcPath, fileOrDir.parentPath),
        fileOrDir.name,
      );
      yield { filename, file };
    }
  }
}

async function* writeFeeds(multi) {
  for (const core of multi.feeds()) {
    const stream = core.createReadStream();
    for await (const fullDoc of stream) {
      const { created_at, timestamp, ...doc } = fullDoc;
      const version = doc.version?.split("@")[1];
      // TODO: use better default version than '_'
      // since that first version of doc doesn't haver a version, and second is 0?
      const filename = `${doc.id}@${version || "_"}.json`;
      try {
        doc.migrationMetadata = await addMigrationMetadata(core, {
          created_at,
          timestamp,
        });
        yield { doc, filename };
      } catch (e) {
        console.error("error creating migration metadata", e);
      }
    }
  }
}

/**
 * @param {typeof import('../types/multifeed.d.ts')} core
 * @param {Record<string,unknown>} doc
 */
async function addMigrationMetadata(core, doc) {
  return {
    rootHashChecksum: crypto.tree(await getRootHash(core)).toString("hex"),
    signature: (await getCoreSignature(core)).toString("hex"),
    coreKey: core.key.toString("hex"),
    blockIndex: core.length,
    created_at: doc.created_at,
    timestamp: doc.timestamp,
  };
}

/**
 * @param {typeof import('multifeed')} multi
 * @returns {Promise<void>}
 */
function multiReady(multi) {
  return new Promise((resolve) => {
    // TODO: ready cb returns two params: a num and a function...
    multi.ready(() => {
      //if(err) return reject(err)
      resolve();
    });
  });
}

/**
 * @param {import('../types/multifeed.d.ts')} core
 * @returns {Promise<Buffer>}
 */
function getCoreSignature(core) {
  return new Promise((resolve, reject) => {
    core.signature(
      /** @param {Error} err
       *  @param {{signature: Buffer}} sig
       */
      (err, sig) => {
        if (err) return reject(err);
        resolve(sig.signature);
      },
    );
  });
}

/**
 * @param {typeof import('../types/multifeed.d.ts')} core
 * @returns {Promise<Buffer>}
 */
function getRootHash(core) {
  return new Promise((resolve, reject) => {
    core.rootHashes(
      0,
      /**
       * @param {Error} err
       * @param {Buffer} roots
       */
      (err, roots) => {
        if (err) return reject(err);
        resolve(roots);
      },
    );
  });
}
