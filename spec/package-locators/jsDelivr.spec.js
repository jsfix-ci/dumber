'use strict';
const test = require('tape');
const jsDelivrLocator = require('../../lib/package-locators/jsDelivr');

function mkResponse (text) {
  return {
    ok: true,
    text: () => Promise.resolve(text)
  }
}

const locator = jsDelivrLocator({bar: '2.0.0-rc1'}, function(url) {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (url.endsWith('foo/package.json') ||
          url.endsWith('foo@1.0.1/package.json')) {
        resolve(mkResponse('{"name":"foo","version":"1.0.1"}'));

      } else if (url.endsWith('bar/package.json') ||
                 url.endsWith('bar@1.9.0/package.json')) {
        resolve(mkResponse('{"name":"bar","version":"1.9.0"}'));

      } else if (url.endsWith('bar@2.0.0-rc1/package.json')) {
        resolve(mkResponse('{"name":"bar","version":"2.0.0-rc1"}'));

      } else if (url.endsWith('@scoped/pkg/package.json') ||
                 url.endsWith('@scoped/pkg@1.0.0/package.json')) {
        resolve(mkResponse('{"name":"@scoped/pkg","version":"1.0.0"}'));
      }

      resolve({statusText: 'Not Found'});
    }, 10);
  });
});

test('jsDelivrNpmPackageLocator rejects missing package', t => {
  locator('nope')
  .then(
    () => t.fail('should not pass'),
    () => t.pass('reject missing package')
  ).then(() => t.end());
});

test('jsDelivrNpmPackageLocator returns fileRead func for existing package', t => {
  locator('foo')
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, '//cdn.jsdelivr.net/npm/foo@1.0.1/package.json');
          const info = JSON.parse(file.contents);
          t.equal(info.name, 'foo');
          t.equal(info.version, '1.0.1');
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  ).then(() => t.end());
});

test('jsDelivrNpmPackageLocator returns fileRead func for fixed package version', t => {
  locator('bar')
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, '//cdn.jsdelivr.net/npm/bar@2.0.0-rc1/package.json');
          const info = JSON.parse(file.contents);
          t.equal(info.name, 'bar');
          t.equal(info.version, '2.0.0-rc1');
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  ).then(() => t.end());
});

test('jsDelivrNpmPackageLocator returns fileRead func rejects missing file for existing package', t => {
  locator('foo')
  .then(
    fileRead => {
      return fileRead('nope.js')
      .then(
        () => t.fail('should not read non-existing file'),
        () => t.pass('rejects missing file')
      );
    },
    () => t.fail('should not fail')
  ).then(() => t.end());
});

test('jsDelivrNpmPackageLocator returns fileRead func for existing scoped package', t => {
  locator('@scoped/pkg')
  .then(
    fileRead => {
      return fileRead('package.json')
      .then(
        file => {
          t.equal(file.path, '//cdn.jsdelivr.net/npm/@scoped/pkg@1.0.0/package.json');
          const info = JSON.parse(file.contents);
          t.equal(info.name, '@scoped/pkg');
          t.equal(info.version, '1.0.0');
        },
        err => t.fail(err.message)
      );
    },
    () => t.fail('should not fail')
  ).then(() => t.end());
});

test('jsDelivrNpmPackageLocator returns fileRead func rejects missing file for existing scoped package', t => {
  locator('@scoped/pkg')
  .then(
    fileRead => {
      return fileRead('nope.js')
      .then(
        () => t.fail('should not read non-existing file'),
        () => t.pass('rejects missing file')
      );
    },
    () => t.fail('should not fail')
  ).then(() => t.end());
});
