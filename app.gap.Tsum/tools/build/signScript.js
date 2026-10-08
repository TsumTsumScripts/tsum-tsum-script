#!/usr/bin/env node
// Signs a built script folder for GAP Companion: writes `gap-signature.json`.
//
//   node tools/build/signScript.js <dist dir> <script id> <version> <key.pem>
//
// Generic: nothing here knows which script it signs, so any script can copy it.
// Format (the host's cloud/adapters/README.md § Script signatures):
//   manifest  {"v":1,"script","version","files":{relPath: sha256 hex}}
//             over every file in the folder except the signature itself
//   payload   base64 of the manifest JSON's UTF-8 bytes
//   sig       base64 DER ECDSA P-256 / SHA-256 over those same bytes
// GAP only gives the companion adapter to a script whose manifest verifies,
// and every listed file must be on the device with that hash.

'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SIGNATURE_FILE = 'gap-signature.json';

/** Every file under `dir`, as sorted `/`-separated relative paths. */
function listFiles(dir, prefix = '') {
  const out = [];
  for (const entry of fs.readdirSync(path.join(dir, prefix), { withFileTypes: true })) {
    const rel = prefix === '' ? entry.name : prefix + '/' + entry.name;
    if (entry.isDirectory()) out.push(...listFiles(dir, rel));
    else if (entry.isFile() && rel !== SIGNATURE_FILE) out.push(rel);
  }
  return out.sort();
}

/**
 * Writes `<dir>/gap-signature.json` and returns the manifest.
 * `keyPem` is an ECDSA P-256 private key in PEM (PKCS8 or SEC1).
 */
function signScript({ dir, script, version, keyPem }) {
  const key = crypto.createPrivateKey(keyPem);
  if (key.asymmetricKeyType !== 'ec' || key.asymmetricKeyDetails.namedCurve !== 'prime256v1') {
    throw new Error('the script key must be ECDSA P-256');
  }
  const files = {};
  for (const rel of listFiles(dir)) {
    files[rel] = crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, rel))).digest('hex');
  }
  if (files['index.js'] === undefined) throw new Error(`${dir} has no index.js`);
  const manifest = { v: 1, script: script, version: version, files: files };
  const payload = Buffer.from(JSON.stringify(manifest), 'utf8');
  const sig = crypto.sign('sha256', payload, key);
  fs.writeFileSync(path.join(dir, SIGNATURE_FILE),
    JSON.stringify({ payload: payload.toString('base64'), sig: sig.toString('base64') }));
  return manifest;
}

module.exports = { signScript, SIGNATURE_FILE };

if (require.main === module) {
  const [dir, script, version, keyFile] = process.argv.slice(2);
  if (!keyFile) {
    console.error('usage: signScript.js <dist dir> <script id> <version> <key.pem>');
    process.exit(2);
  }
  const manifest = signScript({ dir, script, version, keyPem: fs.readFileSync(keyFile, 'utf8') });
  console.log(`[sign] ${SIGNATURE_FILE}: ${script} ${version}, ${Object.keys(manifest.files).length} files`);
}
