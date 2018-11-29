import test from 'tape';
import PackageReader from '../src/package-reader';

function mockLocator(name, filesMap) {
  return function (filePath) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (filesMap[filePath]) return resolve({
          path: 'node_modules/' + name + '/' + filePath,
          contents: filesMap[filePath]
        });
        reject(new Error('cannot find ' + filePath));
      });
    });
  }
}

test('packageReader rejects missing package.json', t => {
  const r = new PackageReader(mockLocator('foo', {
    'index.js': "lorem"
  }));

  r.readMain().then(
    err => {
      t.fail(err.message);
    },
    () => {
      t.pass('it throws');
    }
  ).then(t.end);
});

test('packageReader rejects missing main', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "main": "index"}'
  }));

  r.readMain().then(
    err => {
      t.fail(err.message);
    },
    () => {
      t.pass('it throws');
    }
  ).then(t.end);
});

test('packageReader reads main file', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "main": "index"}',
    'index.js': "lorem"
  }));

  r.readMain().then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/index.js',
        contents: 'lorem',
        moduleId: 'foo/index',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'index.js');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader rejects invalid package.json', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "main": "index"',
    'index.js': "lorem"
  }));

  r.readMain().then(
    () => {
      t.fail('should not pass')
    },
    err => {
      t.pass(err.message);
    }
  ).then(t.end);
});

test('packageReader use default main index.js', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo"}',
    'index.js': "lorem"
  }));

  r.readMain().then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/index.js',
        contents: 'lorem',
        moduleId: 'foo/index',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'index.js');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader reads module over main field', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "module": "es", "main": "index"}',
    'index.js': "lorem",
    'es.js': 'es',
  }));

  r.readMain().then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/es.js',
        contents: 'es',
        moduleId: 'foo/es',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'es.js');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader reads browser over main/module field', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "browser": "br", "module": "es", "main": "index"}',
    'index.js': "lorem",
    'es.js': 'es',
    'br.js': 'br'
  }));

  r.readMain().then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/br.js',
        contents: 'br',
        moduleId: 'foo/br',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'br.js');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader reads main file with explicit ext', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "main": "./main.js"}',
    'main.js': "lorem"
  }));

  r.readMain().then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/main.js',
        contents: 'lorem',
        moduleId: 'foo/main',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'main.js');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader reads main file with non-js file', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "main": "./main.css"}',
    'main.css': "lorem"
  }));

  r.readMain().then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/main.css',
        contents: 'lorem',
        moduleId: 'foo/main.css',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'main.css');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader reads implicit main file', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "main": "./lib"}',
    'lib/index.js': "lorem"
  }));

  r.readMain().then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/lib/index.js',
        contents: 'lorem',
        moduleId: 'foo/lib/index',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'lib/index.js');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader rejects missing resource', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "main": "lib/main"}',
    'lib/main.js': 'lorem',
    'lib/bar.js': 'lorem2'
  }));

  r.readResource('dist/bar').then(
    err => {
      t.fail(err.message);
    },
    () => {
      t.pass('it throws');
    }
  ).then(t.end);
});

test('packageReader reads resource', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "main": "lib/main"}',
    'lib/main.js': 'lorem',
    'lib/bar.js': 'lorem2'
  }));

  r.readResource('lib/bar').then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/lib/bar.js',
        contents: 'lorem2',
        moduleId: 'foo/lib/bar',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'lib/main.js');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader reads relative resource', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "main": "lib/main"}',
    'lib/main.js': 'lorem',
    'lib/bar.js': 'lorem2'
  }));

  r.readResource('bar').then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/lib/bar.js',
        contents: 'lorem2',
        moduleId: 'foo/lib/bar',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'lib/main.js');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader reads deep relative resource', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "main": "dist/cjs/main"}',
    'dist/cjs/main.js': 'lorem',
    'dist/cjs/foo/bar.js': 'lorem2'
  }));

  r.readResource('foo/bar').then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/dist/cjs/foo/bar.js',
        contents: 'lorem2',
        moduleId: 'foo/dist/cjs/foo/bar',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'dist/cjs/main.js');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader reads json resouce', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "main": "dist/cjs/main"}',
    'dist/cjs/main.js': 'lorem',
    'dist/cjs/foo/bar.json': '{"a":1}'
  }));

  r.readResource('foo/bar').then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/dist/cjs/foo/bar.json',
        contents: '{"a":1}',
        moduleId: 'foo/dist/cjs/foo/bar.json',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'dist/cjs/main.js');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader reads directory index.js', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "main": "index"}',
    'index.js': 'lorem',
    'lib/index.js': 'lorem2'
  }));

  r.readResource('lib').then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/lib/index.js',
        contents: 'lorem2',
        moduleId: 'foo/lib/index',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'index.js');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader reads directory index.json', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "main": "index"}',
    'index.js': 'lorem',
    'lib/index.json': '{"a":1}'
  }));

  r.readResource('lib').then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/lib/index.json',
        contents: '{"a":1}',
        moduleId: 'foo/lib/index.json',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'index.js');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader reads directory package.json', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': '{"name":"foo", "main": "index"}',
    'index.js': 'lorem',
    'lib/package.json': '{"module":"es", "main":"index.js"}',
    'lib/es/index.js': 'es',
    'lib/index.js': 'index'
  }));

  r.readResource('lib').then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/lib/es/index.js',
        contents: 'es',
        moduleId: 'foo/lib/es/index',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'index.js');
      t.deepEqual(r.browserReplacement, {});
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader reads browser replacement in package.json', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': `{
      "name": "foo",
      "main": "index",
      "browser": {
        "module-a": false,
        "module-b.js": "./shims/module/b.js",
        "./server/only.js": "./shims/client-only.js"
      }
    }`,
    'index.js': 'lorem'
  }));

  r.readMain().then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/index.js',
        contents: 'lorem',
        moduleId: 'foo/index',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'index.js');
      t.deepEqual(r.browserReplacement, {
        'module-a': false,
        'module-b.js': './shims/module/b',
        './server/only': './shims/client-only'
      });
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader uses browser replacement in package.json to normalize file contents', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': `{
      "name": "foo",
      "main": "index",
      "browser": {
        "module-a": false,
        "module-b.js": "./shims/module/b.js",
        "./server/only.js": "./shims/client-only.js"
      }
    }`,
    'index.js': "require('module-a');require('module-b.js');require('module-c');require('./server/only.js');"
  }));

  r.readMain().then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/index.js',
        contents: "require('__ignore__');require('./shims/module/b');require('module-c');require('./shims/client-only');",
        moduleId: 'foo/index',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'index.js');
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader uses browser replacement in package.json to normalize file contents in sub-folder', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': `{
      "name": "foo",
      "main": "index",
      "browser": {
        "module-a": false,
        "module-b.js": "./shims/module/b.js",
        "./server/only.js": "./shims/client-only.js"
      }
    }`,
    'index.js': 'lorem',
    'server/bar.js': "require('module-a');require('module-b.js');require('module-c');require('./only.js');"
  }));

  r.readResource('server/bar').then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/server/bar.js',
        contents: "require('__ignore__');require('../shims/module/b');require('module-c');require('../shims/client-only');",
        moduleId: 'foo/server/bar',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'index.js');
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});

test('packageReader uses browser replacement in package.json to normalize file contents in sub-folder, case2', t => {
  const r = new PackageReader(mockLocator('foo', {
    'package.json': `{
      "name": "foo",
      "main": "index",
      "browser": {
        "module-a": false,
        "module-b.js": "./shims/module/b.js",
        "./server/only.js": "shims/client-only.js"
      }
    }`,
    'index.js': 'lorem',
    'lib/bar.js': "require('module-a');require('module-b.js');require('module-c');require('../server/only.js');"
  }));

  r.readResource('lib/bar').then(
    unit => {
      t.deepEqual(unit, {
        path: 'node_modules/foo/lib/bar.js',
        contents: "require('__ignore__');require('../shims/module/b');require('module-c');require('../shims/client-only');",
        moduleId: 'foo/lib/bar',
        packageName: 'foo'
      });

      t.equal(r.name, 'foo');
      t.equal(r.mainPath, 'index.js');
    },
    err => {
      t.fail(err.message);
    }
  ).then(t.end);
});