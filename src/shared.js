import fs from 'fs';
import fetch from 'node-fetch';
import crypto from 'crypto';
import {ensureParsed} from 'ast-matcher';
import './ensure-parser-set';

export function info(message) {
  console.info('[dumber] INFO: ' + message);
}

export function warn(message) {
  console.warn('[dumber] WARN: ' + message);
}

export function error(message) {
  console.error('[dumber] ERROR: ' + message);
}

export function stripJsExtension(d) {
   return d && d.endsWith('.js') ? d.substring(0, d.length - 3) : d;
}

export function isPackageName(path) {
  if (path.startsWith('.')) return false;
  const parts = path.split('/');
  // package name, or scope package name
  return parts.length === 1 || (parts.length === 2 && parts[0].startsWith('@'));
}

export function resolvePackagePath(packageName) {
  try {
    let metaPath = require.resolve(packageName + '/package.json');
    return metaPath.substr(0, metaPath.length - 13);
  } catch (e) {
    throw new Error('cannot find npm package: ' + packageName);
  }
}

export function fsReadFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, (err, data) => {
      if (err) reject(err);
      resolve(data);
    });
  })
}

export function contentOrFile(pathOrContent, mock) {
  // decoupling for testing
  let _readFile = (mock && mock.readFile) || fsReadFile;

  if (typeof pathOrContent !== 'string' || !pathOrContent) {
    return Promise.reject(new Error('No content or file provided'));
  }

  // pathOrContent is a path
  if (pathOrContent.match(/^https?:\/\//)) {
    // remote url
    return fetch(pathOrContent)
    .then(response => {
      if (response.ok) return response.text();
      else throw new Error(response.statusText)
    })
    .then(text => {
      ensureParsed(text);
      // pathOrContent is code
      return Promise.resolve({contents: text});
    });
  } else if (pathOrContent.endsWith('.js')) {
    return _readFile(pathOrContent)
    .then(buffer => ({contents: buffer.toString()}));
  } else {
    return new Promise(resolve => {
      ensureParsed(pathOrContent);
      resolve({contents: pathOrContent});
    });
  }
}

export function generateHash(bufOrStr) {
  return crypto.createHash('md5').update(bufOrStr).digest('hex');
}
