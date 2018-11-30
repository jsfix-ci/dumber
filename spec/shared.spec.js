import test from 'tape';
import {stripJsExtension, isPackageName, contentOrFile} from '../src/shared';
import {buildReadFile} from './mock';

test('stripJsExtension keeps other extension', t => {
  t.equal(stripJsExtension('a.json'), 'a.json');
  t.equal(stripJsExtension('./b/a.html'), './b/a.html');
  t.equal(stripJsExtension('foo/a.min'), 'foo/a.min');
  t.equal(stripJsExtension('@bar/foo/a.css'), '@bar/foo/a.css');
  t.end();
});

test('stripJsExtension strips js extension', t => {
  t.equal(stripJsExtension('a.js'), 'a');
  t.equal(stripJsExtension('./b/a.js'), './b/a');
  t.equal(stripJsExtension('foo/a.min.js'), 'foo/a.min');
  t.equal(stripJsExtension('@bar/foo/a.min.js'), '@bar/foo/a.min');
  t.end();
});

test('isPackageName returns true for package name', t => {
  t.ok(isPackageName('foo'));
  t.ok(isPackageName('lorem-name'));
  t.end();
});

test('isPackageName returns true for scoped package name', t => {
  t.ok(isPackageName('@foo/bar'));
  t.end();
});

test('isPackageName returns false for relative module id', t => {
  t.notOk(isPackageName('./foo'));
  t.notOk(isPackageName('../foo/bar'));
  t.notOk(isPackageName('./@foo/bar'));
  t.end();
});

test('isPackageName returns false for sub id', t => {
  t.notOk(isPackageName('foo/bar'));
  t.notOk(isPackageName('@foo/bar/loo'));
  t.end();
});

test('contentOrFile returns passed js content', t => {
  const content = 'var a = 1;';

  contentOrFile(content)
  .then(
    result => t.equal(result.contents, content),
    err => t.fail(err.message)
  )
  .then(t.end);
});

test('contentOrFile reads remote js content', t => {
  const url = 'https://cdn.jsdelivr.net/npm/os-browserify@0.3.0/browser.js';

  contentOrFile(url)
  .then(
    result => t.ok(result.contents.includes('hostname')),
    err => t.fail(err.message)
  )
  .then(t.end);
});

test('contentOrFile rejects wrong remote url', t => {
  const url = 'https://cdn.jsdelivr.net/npm/os-browserify@0.3.0/no-file.js';

  contentOrFile(url)
  .then(
    () =>  t.fail('should not succeed'),
    err => t.pass(err.message)
  )
  .then(t.end);
});

test('contentOrFile reads local js file', t => {
  const path = 'a.js';

  contentOrFile(path, {readFile: buildReadFile({'a.js': 'var a;'})})
  .then(
    result => t.equal(result.contents, 'var a;'),
    err => t.fail(err.message)
  )
  .then(t.end);
});

test('contentOrFile rejects missing local js file', t => {
  const path = 'no-folder/no-file.js';

  contentOrFile(path, {readFile: buildReadFile({'a.js': 'var a;'})})
  .then(
    () =>  t.fail('should not succeed'),
    err => t.pass(err.message)
  )
  .then(t.end);
});

test('contentOrFile rejects invalid input', t => {
  function toReject(p) {
    return p.then(
      () => t.fail('should not resolve'),
      err => t.pass(err.message)
    );
  }
  Promise.all([
    toReject(contentOrFile()),
    toReject(contentOrFile(null)),
    toReject(contentOrFile('')),
    toReject(contentOrFile({path: 'lorem'}))
  ]).then(() => t.end());
});